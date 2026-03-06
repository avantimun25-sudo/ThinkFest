## Packages
date-fns | Needed for formatting dates beautifully and handling calendar logic

## Notes
The application implements a 3-pane responsive layout using the Shadcn Sidebar component.
React state is used to manage selected categories and tasks within a single route to ensure fluid transitions between the panes without triggering full page navigations.
Custom Drizzle/Zod schemas exported from `@shared/routes` use `z.custom()` which act as identity passthroughs at runtime but provide strict TypeScript typings.
