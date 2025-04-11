# Plan to Configure CORS in Next.js Backend

**Target Project:** `C:\Users\diego\Desktop\proyectos\eccomerce_thread_heaven\eccomerce-admin`

**Objective:** Configure the Next.js backend application to send appropriate CORS headers, allowing requests from the frontend origin (`http://localhost:3001`).

**Method:** Modify the `next.config.js` (or `next.config.mjs`) file in the backend project root. We will add a `headers` function to the configuration export. This function allows defining custom headers for specific paths.

**Configuration Details:**

- Target Path: `/api/:path*` (To cover all API routes)
- Headers to Add:
  - `Access-Control-Allow-Origin`: `http://localhost:3001`
  - `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS`
  - `Access-Control-Allow-Headers`: `Content-Type, Authorization`

**Implementation Steps (Post-Switch):**

1.  Switch context to the backend project directory.
2.  Read the contents of `next.config.js` (or `.mjs`).
3.  Apply the necessary changes using `apply_diff` or `write_to_file` to add the `headers` configuration.
4.  Instruct the user to restart their backend Next.js development server.
5.  Verify the fix by attempting the registration on the frontend again.

**Diagram:**

```mermaid
graph TD
    A[Frontend (localhost:3001)] -- Fetch Request --> B[Backend (localhost:3000 - Next.js)];
    B -- CORS Error --> A;
    C{Plan Approved} --> D[Switch Context to Backend Project];
    D --> E[Locate `next.config.js`];
    E --> F[Add CORS Headers Configuration];
    F --> G[Restart Backend Server];
    G --> H[Test Frontend Registration];
    H -- Success --> I((Issue Resolved));
    H -- Failure --> J{Re-evaluate Backend Config};

    style B fill:#f9f,stroke:#333,stroke-width:2px
    style F fill:#ccf,stroke:#333,stroke-width:2px
    style I fill:#9f9,stroke:#333,stroke-width:1px
```
