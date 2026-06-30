# Training a Custom AI Chatbot Model for AgriSL

This guide explains how to fine-tune a language model specifically on Sri Lankan
agricultural data, so the AgriSL chatbot gives better, more accurate, and more
locally relevant answers than the current general-purpose Groq/Gemini approach.

> **Where this fits in AgriSL.** The chatbot lives in
> `server/controllers/chatController.js`. It calls the Groq/Gemini API
> (`server/utils/chatClient.js`) with a detailed system prompt built by
> `buildSystemPrompt()`. Fine-tuning teaches the model this domain knowledge
> *permanently*, so you get better answers, shorter prompts, and no dependency on
> paying for large model APIs in production.

---

## Which approach is right for you?

| Goal | Approach |
|---|---|
| Better answers without training | Improve `buildSystemPrompt()` (already done) |
| Domain-specific knowledge baked in | **Fine-tune an open-source LLM** ← this guide |
| Full control, offline, no API cost | Run the fine-tuned model locally (Ollama) |
| Cloud deployment, production | Deploy fine-tuned model to Hugging Face / Replicate |

---

## Architecture — what changes

```
Current:
  chatController.js
       │
       └──► Groq API (llama-3.3-70b) with system prompt
              ↑ general model, agriculture knowledge from training data

After fine-tuning:
  chatController.js
       │
       ├──► YOUR fine-tuned model (primary, via Ollama or cloud endpoint)
       │
       └──► Groq / Gemini (fallback, if fine-tuned model is down)
```

Only `server/utils/chatClient.js` changes — the controller, DB, sessions,
Sinhala handling, and UI are all untouched.

---

## Part 1 — Decide what to fine-tune

### Option A — Fine-tune an open LLM (recommended for academic project)

Use **Llama 3.2 (1B or 3B)** or **Mistral 7B**. Small enough to train on a free
Colab/Kaggle GPU, yet capable enough for agriculture Q&A.

**Best free option:** Llama 3.2 3B Instruct via **Unsloth** (4× faster fine-tuning
on free Colab T4 GPU). This is the approach this guide follows.

### Option B — Fine-tune via Groq / OpenAI API (no GPU needed)

OpenAI supports fine-tuning GPT-3.5/4o-mini via their API (paid). Groq does not
support fine-tuning yet. Skip to Part 4 for how this changes the `.jsonl` format.

### Option C — Prompt-only improvement (no training)

If fine-tuning is out of scope, you can significantly improve the chatbot by
extending `buildSystemPrompt()` with district-specific data (already partially
done via `getDistrictContext()`). This is not model training and is skipped here.

---

## Part 2 — Collect and prepare training data

Fine-tuning needs **question–answer pairs** in the agriculture + Sri Lanka domain.

### 2.1 Data sources

| Source | What to collect |
|---|---|
| Sri Lanka Dept of Agriculture website | Crop guides, disease bulletins, fertiliser schedules |
| Chat history in your `chat_messages` DB table | Real farmer questions + AI answers |
| FAO / CGIAR Sri Lanka documents | Paddy, coconut, tea production manuals |
| Your advisory articles (`advisory_articles` table) | Already bilingual en/si |
| Manual Q&A writing | Write 200–400 agriculture Q&A pairs covering common crops |

### 2.2 Target format — Alpaca / ShareGPT style

Each training example is a conversation turn. We use the **ShareGPT** format
(pairs of user + assistant turns), which Unsloth/TRL expect:

```json
{
  "conversations": [
    {
      "from": "human",
      "value": "My tomato plants in Kandy district have yellow leaves and black spots. What disease is this and how do I treat it?"
    },
    {
      "from": "gpt",
      "value": "The symptoms you describe — yellow leaves with black spots — are typical of Early Blight (Alternaria solani), which is common in Kandy's wet highland climate.\n\nTreatment:\n- Remove affected leaves immediately and destroy them (do not compost).\n- Apply a copper-based fungicide (e.g. Kocide 2000) or mancozeb every 7–10 days.\n- Avoid overhead watering; water at the base in the morning.\n- Improve air circulation between plants.\n\nFor Kandy district, blight risk is highest during the Maha season (October–January) when humidity is high. Consider a preventive fungicide schedule from October onwards.\n\nImportant: This is AI-generated advice. For important decisions please consult a qualified agricultural officer."
    }
  ]
}
```

### 2.3 Export existing chat history from your DB

Run this query on your AgriSL MySQL database to pull real conversations:

```sql
SELECT
  s.crop_type,
  s.district,
  s.language,
  GROUP_CONCAT(
    CONCAT(m.role, ': ', m.content)
    ORDER BY m.created_at ASC
    SEPARATOR '\n---\n'
  ) AS conversation
FROM chat_sessions s
JOIN chat_messages m ON m.session_id = s.id
WHERE s.status = 'completed'
GROUP BY s.id;
```

Export to CSV and convert each row to ShareGPT JSON. Write a small Python script:

```python
# ml/chatbot/export_chats.py
import csv, json, re

def row_to_examples(row):
    turns = row['conversation'].split('\n---\n')
    convs = []
    for t in turns:
        if t.startswith('user: '):
            convs.append({"from": "human", "value": t[6:].strip()})
        elif t.startswith('assistant: '):
            convs.append({"from": "gpt", "value": t[11:].strip()})
    return {"conversations": convs} if len(convs) >= 2 else None

examples = []
with open('chat_export.csv', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        ex = row_to_examples(row)
        if ex:
            examples.append(ex)

with open('data/chat_history.jsonl', 'w', encoding='utf-8') as f:
    for ex in examples:
        f.write(json.dumps(ex, ensure_ascii=False) + '\n')

print(f"Exported {len(examples)} examples")
```

### 2.4 Write manual agriculture Q&A pairs

The more domain-specific examples, the better. Aim for **300–500 total examples**
covering:

- Paddy (rice) diseases, pests, and irrigation — most important for Sri Lanka
- Coconut, tea, rubber (plantation crops)
- Vegetable crops (tomato, chilli, brinjal)
- Fertiliser schedules for Sri Lankan districts
- Seasonal advice (Maha/Yala seasons)
- Sinhala Q&A pairs (at least 30% of examples in Sinhala)
- Common misconceptions ("should I burn infected plants?" → correct answer: no)

Save all examples as `ml/chatbot/data/train.jsonl` (one JSON object per line).

---

## Part 3 — Fine-tune with Unsloth (free Colab GPU)

Unsloth makes fine-tuning Llama 3.2 / Mistral ~4× faster and fits on a free
Colab T4 GPU (16 GB VRAM). No local GPU required.

### 3.1 Open a Google Colab notebook

Go to colab.research.google.com → New notebook → Runtime → Change runtime type →
**T4 GPU** (free).

### 3.2 Install Unsloth

```python
# Cell 1
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git" -q
!pip install --no-deps trl peft accelerate bitsandbytes datasets -q
```

### 3.3 Load the base model

```python
# Cell 2
from unsloth import FastLanguageModel
import torch

MODEL_NAME = "unsloth/Llama-3.2-3B-Instruct"   # 3B — free T4 fits comfortably
MAX_SEQ_LEN = 2048

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=MAX_SEQ_LEN,
    dtype=None,           # auto-detect (float16 on T4)
    load_in_4bit=True,    # 4-bit quantization — cuts VRAM by ~75%
)
```

### 3.4 Add LoRA adapters (efficient fine-tuning)

LoRA fine-tunes only ~1% of parameters, making it 10–100× cheaper than full
fine-tuning. The base model weights stay frozen; only the adapters are updated.

```python
# Cell 3
model = FastLanguageModel.get_peft_model(
    model,
    r=16,                       # LoRA rank — 16 is a good balance
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)
```

### 3.5 Prepare the dataset

Upload your `train.jsonl` to Colab (Files panel on the left), then:

```python
# Cell 4
from datasets import load_dataset
from unsloth.chat_templates import get_chat_template

tokenizer = get_chat_template(tokenizer, chat_template="llama-3.1")

dataset = load_dataset("json", data_files="train.jsonl", split="train")

def apply_template(examples):
    texts = []
    for convs in examples["conversations"]:
        messages = [
            {"role": "user" if c["from"] == "human" else "assistant",
             "content": c["value"]}
            for c in convs
        ]
        text = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=False)
        texts.append(text)
    return {"text": texts}

dataset = dataset.map(apply_template, batched=True)
print(f"Dataset size: {len(dataset)} examples")
```

### 3.6 Train

```python
# Cell 5
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=MAX_SEQ_LEN,
    dataset_num_proc=2,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        num_train_epochs=3,       # 3 passes through your dataset
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=42,
        output_dir="agrisl_chatbot",
    ),
)

trainer.train()
```

Training 300 examples × 3 epochs takes roughly **10–20 minutes** on a T4 GPU.

### 3.7 Save the fine-tuned model

```python
# Cell 6 — save LoRA adapters (small, ~20 MB)
model.save_pretrained("agrisl_chatbot_lora")
tokenizer.save_pretrained("agrisl_chatbot_lora")

# Cell 7 — merge adapters into full model + save in GGUF format for Ollama
model.save_pretrained_gguf(
    "agrisl_chatbot_gguf",
    tokenizer,
    quantization_method="q4_k_m",   # 4-bit quantized GGUF — ~2 GB, fast on CPU
)
```

Download `agrisl_chatbot_gguf/` from Colab (zip it first):

```python
import shutil
shutil.make_archive("agrisl_chatbot_gguf", "zip", "agrisl_chatbot_gguf")
# Then right-click the zip in Files → Download
```

---

## Part 4 — Test the model locally with Ollama

Ollama runs GGUF models locally with zero configuration — no Python needed for
inference, and the Node server calls it via the same OpenAI-compatible API.

### 4.1 Install Ollama

Download from https://ollama.com and install. Ollama runs as a background service
on `http://localhost:11434`.

### 4.2 Register your fine-tuned model

Create `ml/chatbot/Modelfile`:

```
FROM ./agrisl_chatbot_gguf/unsloth.Q4_K_M.gguf

SYSTEM """
You are AgriSL, an expert agricultural advisor for Sri Lanka.
You give accurate, locally relevant advice in English and Sinhala.
Always end responses with: Important: This is AI-generated advice. For important decisions please consult a qualified agricultural officer.
"""

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 2048
```

Register it with Ollama:

```powershell
cd ml\chatbot
ollama create agrisl-chat -f Modelfile
# Test it:
ollama run agrisl-chat "My rice crop in Polonnaruwa has brown spots. What disease is this?"
```

### 4.3 Verify the API works (Ollama speaks OpenAI format)

```powershell
curl http://localhost:11434/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{"model":"agrisl-chat","messages":[{"role":"user","content":"How do I control aphids on chilli?"}]}'
```

---

## Part 5 — Wire it into the Node server

Only `server/utils/chatClient.js` needs to change. Add a new priority tier:

**Add to `server/.env`:**

```
AGRISL_CHAT_MODEL_URL=http://localhost:11434/v1
AGRISL_CHAT_MODEL_NAME=agrisl-chat
```

**Replace `server/utils/chatClient.js`:**

```javascript
const OpenAI = require('openai');

// Priority 1: fine-tuned AgriSL model via Ollama (best domain knowledge)
// Priority 2: Groq (free, fast, text-only)
// Priority 3: main AI provider (Gemini/OpenAI, shared with disease detection)

const useFineTuned = Boolean(process.env.AGRISL_CHAT_MODEL_URL);
const useGroq = !useFineTuned && Boolean(process.env.GROQ_API_KEY);

let client, model;

if (useFineTuned) {
  client = new OpenAI({
    apiKey: 'ollama',   // Ollama ignores the key but the SDK requires a non-empty string
    baseURL: process.env.AGRISL_CHAT_MODEL_URL,
    maxRetries: 0,
    timeout: 60_000,
  });
  model = process.env.AGRISL_CHAT_MODEL_NAME || 'agrisl-chat';
  console.log('[AI] Chat using fine-tuned AgriSL model via Ollama');
} else if (useGroq) {
  client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    maxRetries: 0,
    timeout: 60_000,
  });
  model = process.env.CHAT_AI_MODEL || 'llama-3.3-70b-versatile';
  console.log('[AI] Chat using Groq (fine-tuned model not configured)');
} else {
  const main = require('./openaiClient');
  client = main.client;
  model = main.model;
  console.warn('[AI] Chat falling back to main AI provider — set AGRISL_CHAT_MODEL_URL or GROQ_API_KEY');
}

module.exports = { client, model };
```

The controller (`chatController.js`) does not change at all — it just calls
`client.chat.completions.create()` with the same messages array.

---

## Part 6 — Improve results (iterating on your model)

### Shorten the system prompt

Once the model is fine-tuned on agricultural domain data, the system prompt in
`buildSystemPrompt()` (`chatController.js:10`) can be simplified significantly.
The model already "knows" it is AgriSL and Sri Lanka context — you no longer need
to explain everything from scratch.

Remove the long `styleGuidance` block and the full district dump; keep only:

```javascript
function buildSystemPrompt(crop_type, district, language) {
  const disclaimer = language === 'si'
    ? 'වැදගත්: ...'
    : 'Important: This is AI-generated advice...';

  return `You are AgriSL. The farmer is asking about ${crop_type} in ${district} district, Sri Lanka.
Respond in ${language === 'si' ? 'Sinhala' : 'English'}.
End with: ${disclaimer}`;
}
```

### Evaluate answer quality (for your academic report)

Create a test set of 30–50 Q&A pairs the model has never seen. For each:

1. Run both the **base model** and **your fine-tuned model** on the same question.
2. Score each answer on: accuracy, local relevance, language naturalness (1–5).
3. Record average scores — this is the "before vs. after fine-tuning" comparison
   your report needs.

Save as `ml/chatbot/evaluate.py`:

```python
import json
from openai import OpenAI

client = OpenAI(api_key="ollama", base_url="http://localhost:11434/v1")

test_pairs = json.load(open("data/test_pairs.json"))  # [{"q": "...", "expected": "..."}]
for pair in test_pairs:
    resp = client.chat.completions.create(
        model="agrisl-chat",
        messages=[{"role": "user", "content": pair["q"]}]
    )
    print("Q:", pair["q"])
    print("Fine-tuned:", resp.choices[0].message.content)
    print("Expected:", pair["expected"])
    print("---")
```

---

## Part 7 — Deploy to production (optional)

### Option A — Hugging Face Inference Endpoints (easy, paid)

1. Push LoRA adapters to Hugging Face Hub:

```python
# In Colab
from huggingface_hub import login
login(token="hf_YOUR_TOKEN")
model.push_to_hub("your-hf-username/agrisl-chat")
tokenizer.push_to_hub("your-hf-username/agrisl-chat")
```

2. Create an Inference Endpoint on huggingface.co/inference-endpoints.
3. Set `AGRISL_CHAT_MODEL_URL` to the endpoint URL in your production `.env`.

### Option B — Run Ollama on a cloud VM (cheap)

Any small Linux VM (Render, Railway, DigitalOcean Droplet, Oracle Free Tier):

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama create agrisl-chat -f Modelfile
```

Set `AGRISL_CHAT_MODEL_URL=http://<vm-ip>:11434/v1` in the Node server's env.

---

## Part 8 — Folder structure summary

```
ml/
└── chatbot/
    ├── data/
    │   ├── train.jsonl          # training Q&A pairs (ShareGPT format)
    │   └── test_pairs.json      # evaluation test set
    ├── Modelfile                # Ollama model definition
    ├── export_chats.py          # DB → jsonl export script
    ├── evaluate.py              # before/after comparison script
    ├── requirements.txt
    └── model/                   # downloaded from Colab
        ├── agrisl_chatbot_lora/ # LoRA adapter weights
        └── agrisl_chatbot_gguf/ # merged GGUF for Ollama
```

---

## Summary checklist

- [ ] Collect 300–500 agriculture Q&A pairs (chat history export + manual writing)
- [ ] Format as ShareGPT JSONL in `ml/chatbot/data/train.jsonl`
- [ ] Open Colab notebook, enable T4 GPU
- [ ] Install Unsloth, load Llama 3.2 3B Instruct
- [ ] Run fine-tuning (3 epochs, ~15 min on T4)
- [ ] Export GGUF model and download from Colab
- [ ] Install Ollama locally, create `agrisl-chat` model with Modelfile
- [ ] Test with `ollama run agrisl-chat "your question"`
- [ ] Update `server/utils/chatClient.js` to use fine-tuned model
- [ ] Add `AGRISL_CHAT_MODEL_URL` and `AGRISL_CHAT_MODEL_NAME` to `server/.env`
- [ ] Restart Node server, test the chatbot page end-to-end
- [ ] Run evaluation: compare base model vs. fine-tuned (for academic report)
- [ ] (Production) push to Hugging Face Hub or deploy Ollama on a cloud VM

---

## Quick comparison — current vs. fine-tuned

| | Current (Groq / Gemini) | Fine-tuned (your model) |
|---|---|---|
| Cost | Free tier (rate limited) | Free to run locally |
| Sri Lanka knowledge | General | Domain-specific |
| Sinhala quality | Good (large model) | Depends on training data |
| Response speed | 0.5–2 s | 1–5 s on CPU |
| System prompt needed | Long (500+ tokens) | Short (50 tokens) |
| API dependency | Yes (Groq/Google) | No (Ollama local) |
| Fine-tuning effort | None | 2–4 hours total |
