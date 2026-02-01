## Packages
recharts | Data visualization library for rendering charts
framer-motion | Smooth animations for page transitions and UI elements
lucide-react | Icon set (already in base, but good to confirm usage)
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind classes safely

## Notes
- Recharts will be used to render dynamic charts from the 'analyses' JSON data.
- File uploads use multipart/form-data via POST /api/files.
- Analysis creation expects a fileId.
- Auth is handled via Replit Auth (useAuth hook).
