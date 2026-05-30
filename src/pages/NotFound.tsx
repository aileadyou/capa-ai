import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface NotFoundProps {
  message?: string;
}

const NotFound = ({ message = "The requested route is not available in the AI Coach Nova demo." }: NotFoundProps) => {
  const location = useLocation();

  useEffect(() => {
    console.info("Nova route fallback:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-md rounded border bg-card p-8 text-center shadow-sm">
        <div className="text-sm font-medium text-muted-foreground">404</div>
        <h1 className="mt-2 text-2xl font-semibold">Page Not Found</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
