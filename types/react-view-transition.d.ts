// Next 16 with experimental.viewTransition aliases `react` to its bundled
// experimental build, which exports a `ViewTransition` component. The stable
// @types/react (19.2.x) does not declare it yet, so we shim the type here.
import "react";

declare module "react" {
  interface ViewTransitionProps {
    name?: string;
    children?: React.ReactNode;
  }
  const ViewTransition: React.FC<ViewTransitionProps>;
}
