import { forwardRef } from 'react';
import { Box as MuiBox, Stack as MuiStack, Grid as MuiGrid } from '@mui/material';

// MUI v9 dropped support for passing system *style* props (alignItems,
// justifyContent, flexWrap, display, gap, ...) directly to Box/Stack/Grid.
// Such props are no longer turned into CSS — instead they leak to the DOM as
// unknown attributes (React warns: "React does not recognize the `alignItems`
// prop on a DOM element") AND the styling is silently lost.
//
// These thin wrappers restore the old ergonomics: any of the layout props below
// passed as a prop is hoisted into `sx`, so existing call sites like
// `<Stack direction="row" alignItems="center">` keep working and actually get
// styled. Prefer `sx` directly in new code; the official guidance is to use it.
// https://mui.com/system/getting-started/the-sx-prop/

// Layout style props that are safe to hoist. Deliberately excludes each
// component's own semantic props — Stack: direction/spacing/divider/useFlexGap;
// Grid: container/size/spacing/direction/offset/columns/wrap — so they pass
// through untouched.
const STYLE_PROPS = new Set([
  'alignItems', 'alignContent', 'alignSelf',
  'justifyContent', 'justifyItems', 'justifySelf',
  'flexWrap', 'flexDirection', 'flexGrow', 'flexShrink', 'flexBasis', 'flex',
  'order', 'gap', 'rowGap', 'columnGap', 'display',
]);

// Pull any STYLE_PROPS out of `props` and fold them into `sx` (explicit `sx`
// wins on conflict, matching MUI precedence). Returns the props to forward.
function hoistStyleProps({ sx, ...rest }) {
  const hoisted = {};
  const passthrough = {};
  for (const key of Object.keys(rest)) {
    if (STYLE_PROPS.has(key)) hoisted[key] = rest[key];
    else passthrough[key] = rest[key];
  }
  if (Object.keys(hoisted).length === 0) return { ...passthrough, sx };
  const merged = [hoisted, ...(Array.isArray(sx) ? sx : [sx])].filter(Boolean);
  return { ...passthrough, sx: merged };
}

export const Box = forwardRef(function Box(props, ref) {
  return <MuiBox ref={ref} {...hoistStyleProps(props)} />;
});

export const Stack = forwardRef(function Stack(props, ref) {
  return <MuiStack ref={ref} {...hoistStyleProps(props)} />;
});

export const Grid = forwardRef(function Grid(props, ref) {
  return <MuiGrid ref={ref} {...hoistStyleProps(props)} />;
});
