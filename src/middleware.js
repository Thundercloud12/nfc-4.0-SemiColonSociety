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
      
      // Redirect authenticated users from public pages to their appropriate dashboards
      if (pathname === "/") {
        if (userRole === "pregnant") {
          console.log("Redirecting pregnant user to /patient-dashboard");
          return NextResponse.redirect(new URL("/patient-dashboard", req.url));
        } else if (userRole === "asha") {
          console.log("Redirecting ASHA worker to /asha-dashboard");
          return NextResponse.redirect(new URL("/asha-dashboard", req.url));
        } else if (userRole === "family") {
          console.log("Redirecting family member to /family-dashboard");
          return NextResponse.redirect(new URL("/family-dashboard", req.url));
        }
      }
      
      // Protect role-specific routes
      if (userRole === "pregnant") {
        // Pregnant users can only access patient-related routes
        if (pathname === "/asha-dashboard" || pathname === "/family-dashboard") {
          console.log("Redirecting pregnant user from", pathname, "to /patient-dashboard");
          return NextResponse.redirect(new URL("/patient-dashboard", req.url));
        }
      } else if (userRole === "asha") {
        // ASHA workers can only access ASHA-related routes
        if (pathname === "/patient-dashboard" || pathname === "/family-dashboard") {
          console.log("Redirecting ASHA worker from", pathname, "to /asha-dashboard");
          return NextResponse.redirect(new URL("/asha-dashboard", req.url));
        }
      } else if (userRole === "family") {
        // Family members can only access family-related routes
        if (pathname === "/patient-dashboard" || pathname === "/asha-dashboard") {
          console.log("Redirecting family member from", pathname, "to /family-dashboard");
          return NextResponse.redirect(new URL("/family-dashboard", req.url));
        }
      }
      
      // Prevent family-login access for authenticated users
      if (pathname === "/family-login") {
        if (userRole === "pregnant") {
          return NextResponse.redirect(new URL("/patient-dashboard", req.url));
        } else if (userRole === "asha") {
          return NextResponse.redirect(new URL("/asha-dashboard", req.url));
        } else if (userRole === "family") {
          return NextResponse.redirect(new URL("/family-dashboard", req.url));
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
