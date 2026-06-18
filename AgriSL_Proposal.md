W.M. Akash Shamika Wijekoon - E195569
PROJECT PROPOSAL
AGRISL — AN AI-BASED BILINGUAL FARMING SUPPORT WEB PLATFORM FOR SRI LANKA
MAY 15, 2026
W.M. AKASH SHAMIKA WIJEKOON
E195569 / K2635762
Supervisor: Ms. Indumini
1 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
Contents
Abstract ................................................................................................................................................... 2
1. Introduction & Background................................................................................................................. 3
1.1 Introduction ................................................................................................................................ 3
1.2 Background and Motivation ....................................................................................................... 4
1.3 Problem in Brief .......................................................................................................................... 5
2. Aim & Objectives ................................................................................................................................. 6
2.1 Aim .............................................................................................................................................. 6
2.2 Objectives ................................................................................................................................... 6
3. Technologies & Resources .................................................................................................................. 8
3.1 Technologies Used ...................................................................................................................... 8
3.2 Resource Requirements ............................................................................................................. 8
4. Methodology & Work Plan ................................................................................................................. 9
4.1 Overview of Methodology .......................................................................................................... 9
4.2 Work Plan and Milestones ....................................................................................................... 10
5. Proposed Solution and Initial Steps .................................................................................................. 11
5.1 Overview of the Proposed Solution.......................................................................................... 11
5.2 Suggested Starting Point .......................................................................................................... 12
6. Discussion .......................................................................................................................................... 13
6.1 Ethical, Legal, Societal, and Security Considerations ............................................................... 13
7. Conclusion and Future Work ............................................................................................................ 15
References ............................................................................................................................................ 16
Figure 1 – Gantt Chart
Table 1 – Technology Stack Summary
Table 2 – Work Plan and Milestones
2 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
Abstract
AgriSL is a web-based bilingual platform developed to address a clearly identified gap in Sri Lanka’s
agricultural information landscape: the absence of a dedicated, structured system through which Sinhala-
speaking farmers can access personalised farming advice, crop disease diagnostics, and expert agricultural
guidance within a single digital environment. The platform enables registered users to submit farming
queries in either English or Sinhala, receive AI-generated bilingual responses tailored to their crop type
and district, upload images of affected crops for disease identification, and access verified advisory
content published by qualified agricultural officers.
The system is built using a prescribed technology stack comprising React.js and Vite for the frontend
presentation layer, Node.js and Express.js for the backend application logic, and MySQL as the relational
database engine. An OpenAI API integration provides the core language model capability that powers the
bilingual chatbot. This combination produces a scalable, maintainable web application accessible from
both desktop and mobile browsers without dependence on proprietary licensing arrangements.
A defining characteristic of AgriSL is its three-module architecture. The AI-powered chatbot collects
structured contextual inputs from farmers — including crop type, district, and problem description —
before generating contextually appropriate responses in the farmer’s preferred language. The crop
disease detection module accepts photographic input and returns an AI-assisted diagnosis with
recommended treatment. The expert advisory portal allows registered agricultural officers to publish
verified bilingual content accessible to all farmers without requiring account registration.
Development follows the Agile methodology, with iterative sprints delivering functional increments in a
defined dependency sequence from foundational infrastructure through authentication, core modules,
and final testing and documentation. Future development directions include integration of additional
Sinhala NLP models, geolocation-based district autodetection, and a mobile application wrapper for
offline access in low-connectivity rural areas.
3 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
1. Introduction & Background
1.1 Introduction
The expansion of digital platform economies over the past decade has produced demonstrable benefits
for consumers and small-scale service providers across a wide range of sectors. Ride-hailing, freelance
labour markets, e-commerce, and remote healthcare delivery have each been transformed by the
emergence of dedicated web platforms that reduce transaction costs, improve information symmetry,
and enable individuals to access services that would otherwise remain unavailable to them. Despite this
broad and well-documented trend, one domain has received comparatively little attention from platform
developers in developing nations: agricultural advisory services delivered in the native languages of the
farming population.
In virtually every Sri Lankan rural district, a significant volume of farming knowledge remains inaccessible
to most of the farming population due to language barriers. Crop management guidelines, pest control
recommendations, seasonal planting calendars, and disease treatment protocols are predominantly
published in English — a language spoken fluently by fewer than 25% of the rural farming community.
Simultaneously, farmers who urgently require guidance on crop failure, disease outbreak, or market
timing have no reliable digital platform through which to obtain this guidance in Sinhala. This mismatch
between latent demand and existing supply constitutes a straightforward information asymmetry that a
purpose-built digital platform is well positioned to resolve. (Nakasone, Torero and Minten, 2014)
AgriSL is proposed as a web-based bilingual application designed to address this inefficiency directly. The
platform creates a structured environment in which farmers can interact with an AI-powered chatbot in
their preferred language, upload images of affected crops for instant disease identification, and access
verified expert advisory content published by qualified agricultural officers. The result is a community-
facing information platform that is more reliable, more accessible, and more contextually relevant than
the informal alternatives currently available to Sri Lankan farmers.
The system is developed within a constrained and accessible technology stack — React.js, Express.js,
MySQL, and the OpenAI API — which ensures that the application can be deployed and maintained
without dependence on proprietary commercial services or specialist infrastructure. This constraint also
4 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
reinforces the academic objective of demonstrating full-stack web development competence using widely
adopted open-source technologies.
1.2 Background and Motivation
The conceptual foundations of digital agricultural extension services have been articulated in academic
literature for over two decades. Aker (2011) was among the earliest researchers to demonstrate that
mobile-based agricultural advisory services in developing countries produce measurable improvements
in crop yields, market participation, and income, while Nakasone, Torero and Minten (2014) provided a
comprehensive analysis of the conditions under which ICT-based platforms generate lasting productivity
improvements for smallholder farmers. Their work identified three prerequisites for a successful digital
agricultural advisory platform: content relevance to local growing conditions, accessibility to users with
limited technical literacy, and delivery in the farmer’s native language. Each of these conditions is directly
addressed in the design of AgriSL.
Within the Sri Lankan agricultural information market specifically, the dominant model has historically
been government-published advisory content in English and periodic in-person extension visits from
provincial agricultural officers. The Department of Agriculture maintains several web portals providing
crop calendars, pest management guidelines, and market price data; however, these resources remain
predominantly in English and assume a level of digital literacy and language proficiency that most rural
farmers do not possess. The 2019 Sri Lanka Digital Readiness Survey reported that rural mobile internet
penetration had reached 62%, indicating growing infrastructure for digital service delivery, yet no bilingual
AI-powered agricultural advisory platform exists to serve this audience.
Platform-based approaches to agricultural advisory have begun to emerge in some markets. India’s Kisan
Suvidha and South Africa’s Agri4All offer crop advisory interfaces, but their scope is limited to English-
medium content and they lack the bilingual AI interaction and district-specific personalisation relevant to
Sri Lankan farming zones. Existing Sri Lankan government platforms such as eSabhagadhara provide
structured content but offer no interactive query capability, no disease detection functionality, and no
bilingual interface. AgriSL is motivated by the observation that this underserved demand exists within
virtually every Sri Lankan rural district, and that a focused web platform built on widely available
technologies is sufficient to address it effectively.
5 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
The inclusion of an AI chatbot layer reflects a deliberate design decision rooted in the technology adoption
literature. Davis (1989) demonstrated that perceived ease of use is the most significant predictor of
voluntary technology adoption by individuals with limited prior experience. By providing a conversational
interface that accepts natural language input in Sinhala, AgriSL reduces this adoption barrier substantially
for its target user population.
1.3 Problem in Brief
The problem that AgriSL seeks to address can be stated with precision. There exists no widely accessible,
purpose-built digital platform through which Sinhala-speaking Sri Lankan farmers can submit farming
queries in their native language and receive personalised, AI-generated guidance tailored to their specific
crop type, district, and problem description. The informal alternatives that currently exist — English-only
government portals, generic agricultural websites, and word-of-mouth arrangements — lack bilingual
support, conversational AI capability, structured disease detection, and verified expert content.
For farmers who need urgent crop disease guidance, the absence of a platform means there is no reliable
mechanism through which to obtain a rapid diagnosis, treatment recommendation, or expert advisory
content in Sinhala. For agricultural officers who wish to publish bilingual guidance to farming
communities, there is no structured platform through which to do so at scale. For both parties, the lack
of any integrated bilingual digital infrastructure means that a large volume of potentially preventable crop
failures and associated financial losses occur annually.
These deficiencies collectively mean that the majority of Sri Lanka’s farming population remains
disconnected from the digital agricultural knowledge economy. AgriSL proposes to resolve all these issues
within a single, coherent web application that provides farmers with a bilingual query interface and
disease detection module, agricultural officers with a content publishing portal, and all parties with a
notification system and bilingual knowledge base.
6 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
2. Aim & Objectives
2.1 Aim
The primary aim of the AgriSL project is to design, develop, and deploy a fully functional bilingual web-
based platform that enables Sri Lankan farmers to access personalised AI-generated agricultural guidance,
crop disease detection, and expert advisory content in both Sinhala and English through a single,
accessible digital interface.
2.2 Objectives
In pursuit of the stated aim, the following specific objectives have been defined for the AgriSL project:
• Develop a complete web application using React.js, Vite, Node.js, Express.js, and MySQL that
delivers all core platform functionality within a single deployable full-stack codebase requiring
no external proprietary dependencies beyond the OpenAI API.
• Implement a secure user registration and authentication system supporting JWT-based login,
logout, and crypt password hashing, with role-based access control differentiating standard
farmers from registered agricultural officers.
• Build an AI-powered bilingual chatbot module through which authenticated users may submit
farming queries in either English or Sinhala, providing crop type, district, and problem
description as structured inputs. The chatbot must generate contextually appropriate responses
in the language of the user’s input using the OpenAI API.
• Implement a crop disease detection feature through which farmers may upload photographs of
affected crops and receive an AI-generated disease diagnosis and recommended treatment
plan, rendered in both Sinhala and English.
• Build an expert advisory portal through which registered agricultural officers may create, edit,
and publish bilingual advisory articles, seasonal planting guides, and answers to common
farming questions accessible to all farmers without requiring account registration.
• Develop an in-application notification system that delivers contextually appropriate messages to
users at each significant workflow event, including chatbot session completion, disease
detection result availability, and new advisory content publication.
• Design and implement an agricultural officer dashboard providing content management
interfaces for advisory articles, and a user dashboard allowing farmers to review their query
history, saved disease detection results, and bookmarked articles.
7 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
• Conduct systematic functional testing across all modules to validate correctness, input
validation behaviour, and edge case handling, confirming that the application operates without
errors in a standard Node.js and React.js runtime environment.
• Evaluate the usability and effectiveness of the AgriSL platform through user acceptance testing
with a minimum of ten Sri Lankan farmers and five agricultural officers, and refine the system
based on structured feedback.
• Prepare complete technical documentation and a final project report in accordance with
Kingston University Top-Up Degree programme guidelines.
8 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
3. Technologies & Resources
3.1 Technologies Used
AgriSL is developed using the following technology stack, selected in accordance with the project’s
academic and functional constraints. Table 1 provides a structured summary of each technology, the layer
it operates within, and its specific purpose within the application.
Layer Technology Purpose within AgriSL
Frontend React.js + Vite Component-based UI; fast hot-module reload; excellent
Unicode and Sinhala font rendering
Frontend Material UI (MUI) Pre-built accessible components; responsive design system;
professional theming
Backend Node.js + JavaScript runtime and web framework for REST API
Express.js construction, routing, and middleware management
Database MySQL Relational database engine for users, chat logs, disease
reports, and advisory articles
AI Chatbot OpenAI API (GPT- Multilingual large language model generating bilingual Sinhala
4) and English farming advice
Disease TensorFlow.js / Pre-trained image classification model for crop disease
Detection PlantNet API identification from uploaded photographs
Authentication JWT + bcrypt Stateless user authentication with secure password hashing
and role-based access control
Version Git + GitHub Source control, collaboration, and project history
Control management throughout the development cycle
Deployment Localhost / Vercel Development on localhost; optional cloud deployment via
Vercel for demonstration and testing
Table 1 – Technology Stack Summary
3.2 Resource Requirements
The successful development and deployment of AgriSL requires the following categories of resource:
• Development Environment: A personal computing device running Node.js version 18 or higher
and a standard code editor (Visual Studio Code). No paid software licences are required at any
stage of development or deployment.
9 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
• OpenAI API Key: A paid or free-tier OpenAI API key is required for chatbot functionality during
development and user acceptance testing. Usage costs are estimated to remain within free-tier
limits for academic testing purposes.
• Sinhala Font Support: Google Noto Sans Sinhala font loaded via CDN for web rendering of
Sinhala-script text across all platform pages.
• Agricultural Data: Crop information, disease datasets, and seasonal calendars sourced from the
Sri Lanka Department of Agriculture open data portal and verified academic agricultural
literature.
• Database: A MySQL database instance installed locally for development, with schema initialised
automatically on first application start via a provided migration script. No separate database
administration infrastructure is required.
• Testing: Functional and integration testing conducted manually through a web browser and
automated HTTP request scripts written in JavaScript. No commercial testing tools or licences
are required.
• Human Resources: A single developer with competence in React.js, Node.js, Express.js,
relational database design, and REST API integration is sufficient to deliver the complete project
within the defined timeline. Academic supervision provides additional guidance and review
throughout the development cycle.
10 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
4. Methodology & Work Plan
4.1 Overview of Methodology
The development of AgriSL follows the Agile software development methodology, adapted to a solo-
developer academic project context. Agile is selected because it accommodates the iterative discovery of
detailed requirements and allows the developer to respond to issues identified during testing without
being constrained by a rigid sequential plan. The alternative Waterfall approach, while appropriate for
projects with fully specified and stable requirements, is less suitable here because certain implementation
details — particularly those relating to the OpenAI API prompt engineering and the bilingual rendering
pipeline — can only be fully understood once adjacent modules are operational and their data structures
established. (Paul Pavlou, 2006)
Development is organised into a series of focused sprints, each delivering a working and testable
increment of the system. The earliest sprints establish foundational infrastructure before proceeding to
primary functional modules in a logical dependency order. Testing is integrated into each sprint rather
than deferred to a terminal testing phase, ensuring that defects are identified and corrected before they
propagate into dependent modules. The Model-View-Controller (MVC) architectural pattern organises
the Express.js backend codebase throughout, with controllers encapsulating business logic, routes
defining the URL structure, and React components presenting information to users through the browser.
4.2 Work Plan and Milestones
Phase Month Task Description Deliverables
1 1 Project setup, directory structure, Operational server, database migration
Express server configuration, script, seeded admin and test user accounts
MySQL schema design and
initialisation
2 1-2 User authentication — registration, Secure auth flow with require AUTH and
login, logout, session management, require Officer middleware
bcrypt password hashing, JWT
middleware, role-based access
control
3 2-3 AI chatbot module — contextual Functional chatbot with bilingual EN/SI
input form, OpenAI API integration, response generation and chat history
bilingual prompt engineering, storage
11 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
| Phase  Month  | Task Description  | Deliverables  |
| ------------- | ----------------- | ------------- |
response rendering in Sinhala and
English
4  3  Crop disease detection — image  Disease detection module with image
upload interface, TensorFlow.js or  upload, diagnosis result, and bilingual
|     | PlantNet API integration, diagnosis  | treatment output  |
| --- | ------------------------------------ | ----------------- |
rendering with treatment
recommendations
5  3-4  Expert advisory portal — officer  Advisory article CRUD for officers and public
|     | content creation, bilingual article  | browse page for farmers  |
| --- | ------------------------------------ | ------------------------ |
editor, category tagging, public
browse page with search and filter
6  4  Notification system — full  Bell icon with badge, notification dropdown,
|     | workflow coverage, unread count  | read state management in MySQL  |
| --- | -------------------------------- | ------------------------------- |
badge, mark-as-read functionality,
notification dropdown list
7  4-5  User dashboard — chat history,  Complete multi-pane farmer dashboard
|     | saved disease results, bookmarked  | with history and saved content  |
| --- | ---------------------------------- | ------------------------------- |
articles, profile management
8  5  Agricultural officer dashboard —  Complete officer content management
|     | article management, pending  | panel  |
| --- | ---------------------------- | ------ |
review queue, publication status
indicators
9  5-6  UI polish — Sinhala font  Finalised consistent visual design across all
|     | integration, responsive layout,  | pages in both languages  |
| --- | -------------------------------- | ------------------------ |
bilingual toggle, consistent theming
with Material UI
10  6  System-wide testing — functional  Test log, documented bug fixes, UAT
|     | testing of all modules, edge case  | feedback report  |
| --- | ---------------------------------- | ---------------- |
handling, input validation,
integration testing, UAT with
farmers and officers
11  6-7  Documentation — README, inline  Complete project documentation set and
|     | code comments, academic report  | final submission package  |
| --- | ------------------------------- | ------------------------- |
preparation for all required
Kingston University reports

Table 2 – Work Plan and Milestones

Figure 1 – Gantt Chart
  12 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
AgriSL — Project Gantt Chart
Development schedule · 7-month timeline · W.M. Akash Shamika Wijekoon · E195569
Phase / Task  Month 1  Month 2  Month 3  Month 4  Month 5  Month 6  Month 7
P1 Project setup & DB
| schema  |     |     |     |     |     |     |     |
| ------- | --- | --- | --- | --- | --- | --- | --- |
P2 User authentication &
|     |     |     |     |     |     |     |     |
| --- | --- | --- | --- | --- | --- | --- | --- |
roles
P3 AI bilingual chatbot
|     |     |     |     |     |     |     |     |
| --- | --- | --- | --- | --- | --- | --- | --- |
module
| P4 Crop disease  |     |     |     |     |     |     |     |
| ---------------- | --- | --- | --- | --- | --- | --- | --- |
detection
| P5 Expert advisory portal  |     |     |     |     |     |     |     |
| -------------------------- | --- | --- | --- | --- | --- | --- | --- |
| P6 Notification system     |     |     |     |     |     |     |     |
| P7 User dashboard          |     |     |     |     |     |     |     |
P8 Agricultural officer
|     |     |     |     |     |     |     |     |
| --- | --- | --- | --- | --- | --- | --- | --- |
dashboard
P9 UI polish & bilingual
|     |     |     |     |     |     |     |     |
| --- | --- | --- | --- | --- | --- | --- | --- |
theming
| P10 System-wide testing  |     |     |     |     |     |     |     |
| ------------------------ | --- | --- | --- | --- | --- | --- | --- |
& UAT
P11 Documentation &
|     |     |     |     |     |     |     |     |
| --- | --- | --- | --- | --- | --- | --- | --- |
final report
Legend
Infrastructure & authentication  Core AI modules
|                           |     |     |                |     |     |     |     |
| ------------------------- | --- | --- | -------------- | --- | --- | --- | --- |
|   Portal & notifications  |     |     | Dashboards     |     |     |     |     |
|   UI polish & testing     |     |     | Documentation  |     |     |     |     |

|     |     |     |     |     |     |     |           |
| --- | --- | --- | --- | --- | --- | --- | --------- |
|     |     |     |     |     |     |     | 13 of 16  |
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
5. Proposed Solution and Initial Steps
5.1 Overview of the Proposed Solution
AgriSL proposes a multi-role web application in which three distinct actor types — standard farmer users,
registered agricultural officers, and administrators — interact with a shared platform through role-specific
interfaces and workflow pathways.
Standard farmer users may create accounts, access the bilingual chatbot to submit farming queries in
Sinhala or English, upload photographs of affected crops for disease detection, and browse the public
expert advisory catalogue. Once a chatbot session is completed, the user receives a response generated
by the OpenAI API in their chosen language, with the full session stored in their personal dashboard for
future reference. Users who receive a disease detection result may save that result to their dashboard
and share it with a local agricultural officer for verification.
Agricultural officers, who hold a distinct role from standard farmer users, may additionally create and
publish bilingual advisory articles through a dedicated content management interface. Officers can
manage their published articles, track readership metrics, and respond to farmer queries flagged for
expert review. The officer dashboard displays the publication status of each article — draft, published, or
archived — allowing officers to immediately identify content requiring attention or update.
The administrator operates exclusively through a dedicated panel accessible only to accounts holding the
administrator role. From this panel, the administrator may review all registered users, manage agricultural
officer account approvals, monitor platform activity statistics, and access all chatbot session logs and
disease detection records for quality assurance purposes. The administrator panel also provides aggregate
platform statistics and management tables for all users, all advisory articles, and all disease detection
submissions.
The reviews and advisory ratings module operate independently of the administrative approval process.
Only users who have completed at least one chatbot session or disease detection interaction are
permitted to rate advisory content. The average rating derived from all reviews for a given article is
14 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
recalculated on retrieval and displayed prominently on article cards and detail pages throughout the
advisory browse interface.
5.2 Suggested Starting Point
The initial phase of development focuses on establishing the project’s structural and infrastructural
foundations before any application-level features are implemented. This involves creating the directory
structure according to the Model-View-Controller pattern, initialising the Node.js project with its
dependency manifest, configuring the Express.js server with appropriate middleware for JSON parsing,
URL-encoded form handling, JWT session management, and static file serving, and writing the MySQL
database initialisation script that creates all required tables and seeds default records including the
administrator account and the standard farming categories.
Once this foundation is in place, the authentication module is the first functional component to be
developed. Authentication is a prerequisite for every other module in the system, as the JWT token data
it establishes is consumed throughout the application for access control, ownership verification, and
notification targeting. Only after authentication is fully operational and tested does development proceed
to the chatbot and disease detection modules, followed by the expert advisory portal, and finally to the
peripheral modules including notifications, dashboards, and the bilingual UI layer.
This sequencing reflects a deliberate choice to build depth rather than breadth in the early sprints. A
platform in which authentication and the chatbot module are complete and reliable is more useful for
testing and feedback than one in which all features exist in an incomplete state. It also ensures that the
bilingual rendering pipeline — which depends upon the existence of fully operational chatbot and disease
detection modules — can be integrated into a stable codebase rather than developed against incomplete
foundations.
15 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
6. Discussion
6.1 Ethical, Legal, Societal, and Security Considerations
Ethical Considerations
AgriSL is committed to operating in accordance with the highest ethical standards throughout its design,
development, and deployment. The platform’s core architecture reflects a set of ethical commitments
embedded directly within the system’s functional design rather than appended as policy statements. The
AI chatbot includes clearly visible disclaimers advising farmers that AI-generated guidance is not a
substitute for consultation with a qualified agricultural officer, constituting a form of consumer protection
built into the system’s fundamental workflow. The disease detection module presents results as
suggested diagnoses rather than definitive clinical verdicts, with explicit prompts encouraging users to
verify results with a local agricultural officer before acting on them. The reviews and ratings system create
accountability for advisory content, incentivising accurate representation and professional conduct
among agricultural officers.
Regarding data ethics, the platform collects only the personal information strictly necessary for its
operation — specifically, a user’s name, email address, district, and bcrypt-hashed password. No financial
data is processed by the platform in its current implementation, and no personal information is shared
with third parties or used for purposes beyond facilitating the agricultural advisory functions for which
users registered. Chat session data and disease detection image uploads are retained solely for the user’s
own dashboard reference and platform quality assurance purposes.
Legal Considerations
From a legal perspective, the platform must operate in compliance with applicable data protection
legislation. The Sri Lanka Personal Data Protection Act No. 9 of 2022 (PDPA) entitles users to know what
personal data is held about them, to request its correction, and to request its deletion. While AgriSL in its
current academic implementation does not include a formal PDPA compliance interface, the principles of
data minimisation, purpose limitation, and storage limitation are reflected throughout the platform’s data
collection practices. Production deployment would require explicit consent mechanisms at registration, a
published privacy policy accessible from all pages, and a formal data subject rights management process.
16 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
Regarding the OpenAI API integration, the platform’s usage of this service is subject to OpenAI’s Terms of
Service and Usage Policies, which prohibit the use of the API to generate harmful, misleading, or medically
dangerous content. The platform’s system prompt engineering is designed to constrain the model
exclusively to agricultural advisory topics and to include appropriate disclaimers in all generated
responses.
Societal Considerations
The societal benefits of a platform such as AgriSL extend beyond the direct informational interests of
individual farmers. By enabling Sinhala-language interaction with AI-powered advisory systems, the
platform contributes to digital equity and linguistic inclusion for a population that has historically been
excluded from the benefits of agricultural technology adoption. The United Nations’ Sustainable
Development Goal 2 (Zero Hunger) specifically recognises the role of digital agricultural platforms in
improving smallholder farmer productivity, and platforms that deliver verified advisory content in
farmers’ native languages contribute positively to these international development objectives.
At a community level, AgriSL facilitates knowledge transfer between qualified agricultural officers and the
farming community at a scale and accessibility that in-person extension services alone cannot match. For
lower-income farming households in remote districts, access to AI-powered bilingual advisory content
reduces the financial and logistical barrier to obtaining expert guidance, which carries tangible quality-of-
life and livelihood implications.
Security Considerations
Security is addressed at multiple levels within the AgriSL architecture. At the authentication layer, all
passwords are processed through bcrypt before storage, ensuring that even in the event of a database
compromise, plaintext credentials are not exposed. Authentication state is managed through JWT tokens
with appropriate expiry periods, and token validation is enforced on every protected route through
dedicated middleware.
At the application layer, all user-submitted data is validated on the server side before processing, with
particular attention to input sanitisation to prevent SQL injection attacks on the MySQL database. The
platform validates all ID parameters and user inputs before any database query is executed. File upload
security for the disease detection image module is addressed through MIME type filtering and maximum
file size enforcement, restricting uploads to recognised image formats.
17 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
The agricultural officer and administrator roles are enforced through middleware that verifies JWT token
claims and role assignment before permitting access to any officer or administrative route. Standard
farmer users are unable to access officer or administrative endpoints regardless of the URL they attempt
to request. Route separation between farmer-facing, officer-facing, and administrative endpoints further
reduces the attack surface by ensuring that privileged functionality is not inadvertently exposed to
unauthenticated or insufficiently authorised requests.
18 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
7. Conclusion and Future Work
AgriSL represents a coherent, purposeful, and technically feasible solution to a genuine and underserved
information need within Sri Lanka’s farming community. By providing Sinhala-speaking farmers with a
structured bilingual platform through which to access AI-generated farming advice, crop disease
detection, and expert agricultural guidance, the project creates tangible informational value for a
population that has historically been excluded from the benefits of digital agricultural knowledge
platforms. The three-module architecture — covering the AI chatbot, disease detection, and expert
advisory portal — provides a level of platform comprehensiveness and language accessibility that
distinguishes AgriSL from English-only government portals and from general-purpose agricultural
websites.
The technology stack — React.js, Vite, Node.js, Express.js, MySQL, and the OpenAI API — is both
appropriate to the project’s requirements and consistent with the constraints defined for the academic
project. The use of Material UI ensures that the bilingual interface maintains professional visual standards
while accommodating the rendering requirements of the Sinhala script. The decision to implement a full-
stack JavaScript architecture ensures that the resulting codebase demonstrates fundamental competence
across all layers of the web application stack rather than competence in the use of high-level abstractions
alone.
Looking ahead, several directions for future development present themselves as natural extensions of the
current system. Integration of a dedicated Sinhala NLP model, such as a fine-tuned BERT variant trained
on agricultural text corpora, would improve the accuracy and naturalness of Sinhala-language chatbot
responses beyond what the general-purpose OpenAI API can achieve. A geolocation-based district auto-
detection feature would allow the platform to automatically identify a farmer’s district from their device
location, eliminating a manual input step and improving the contextual relevance of AI-generated advice.
A mobile application wrapper built using React Native would extend the platform’s accessibility to farmers
in low-connectivity environments, enabling offline access to previously retrieve advisory content and
cached disease detection results. As the user base grows, a community reputation scoring system based
on the cumulative advisory quality ratings of individual agricultural officers — as opposed to individual
articles — would provide additional trust signals benefiting all farmers seeking reliable guidance.
19 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
20 of 16
AgriSL — Bilingual Farming Support Platform

W.M. Akash Shamika Wijekoon - E195569
References
Aker, J.C. (2011) ‘Dial “A” for Agriculture: A Review of Information and Communication Technologies for
Agricultural Extension in Developing Countries’, Agricultural Economics, 42(6), pp. 631–647.
Davis, F.D. (1989) ‘Perceived Usefulness, Perceived Ease of Use, and User Acceptance of Information
Technology’, MIS Quarterly, 13(3), pp. 319–340.
Department of Agriculture Sri Lanka (2022) Annual Report 2022. Peradeniya: Department of Agriculture.
Nakasone, E., Torero, M. and Minten, B. (2014) ‘The Power of Information: The ICT Revolution in
Agricultural Extension’, Annual Review of Resource Economics, 6(1), pp. 533–550.
OpenAI (2025) OpenAI API Documentation. [Online] Available at: https://platform.openai.com/docs
[Accessed: 01 05 2026].
Paul Pavlou, M.F. (2006) ‘Understanding and Predicting Electronic Commerce Adoption: An Extension of
the Theory of Planned Behavior’. [Online] Available at:
https://www.researchgate.net/publication/220260096 [Accessed: 12 05 2026].
Sri Lanka Personal Data Protection Act No. 9 of 2022. Colombo: Government of Sri Lanka.
Telecom Regulatory Commission of Sri Lanka (2019) Digital Readiness Survey 2019. Colombo: TRCSL.
21 of 16
AgriSL — Bilingual Farming Support Platform
