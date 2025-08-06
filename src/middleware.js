import withAuth from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    console.log("Middleware - Token:", token);
    console.log("Middleware - Pathname:", req.nextUrl.pathname);
    
    const { pathname } = req.nextUrl;

    const isPublicPage = ["/", "/login", "/register", "/family-login"].includes(pathname);

    if (!token && !isPublicPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    // Role-based redirects for authenticated users
    if (token) {
      const userRole = token.role;
      console.log("Middleware - User role:", userRole);
      
      // Redirect family members to family dashboard if they try to access other dashboards
      if (userRole === "family") {
        if (pathname === "/patient-dashboard" || pathname === "/asha-dashboard") {
          console.log("Redirecting family member from", pathname, "to /family-dashboard");
          return NextResponse.redirect(new URL("/family-dashboard", req.url));
        }
        // Redirect family members from login pages to their dashboard
        if (pathname === "/login" || pathname === "/register") {
          console.log("Redirecting family member from", pathname, "to /family-dashboard");
          return NextResponse.redirect(new URL("/family-dashboard", req.url));
        }
        // Redirect family members from root to their dashboard
        if (pathname === "/") {
          console.log("Redirecting family member from root to /family-dashboard");
          return NextResponse.redirect(new URL("/family-dashboard", req.url));
        }
      }
      
      // Redirect other users away from family dashboard
      if (userRole !== "family" && pathname === "/family-dashboard") {
        if (userRole === "pregnant") {
          return NextResponse.redirect(new URL("/patient-dashboard", req.url));
        } else if (userRole === "asha") {
          return NextResponse.redirect(new URL("/asha-dashboard", req.url));
        } else {
          return NextResponse.redirect(new URL("/", req.url));
        }
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes – allow unauthenticated access
        if (["/", "/login", "/register", "/family-login"].includes(pathname)) {
          return true;
        }

        // All other routes – require token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Exclude _next, images, favicon, public, and API routes
    "/((?!_next/static|_next/image|favicon.ico|api/|images/).*)",
  ],
};
