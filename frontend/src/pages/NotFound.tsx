import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import errorImage from "@/assets/error-404.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <img
        src={errorImage}
        alt="Page non trouvée"
        className="mb-8 w-full max-w-md rounded-3xl"
      />
      <h1 className="mb-3 font-display text-4xl font-bold text-foreground md:text-5xl">
        Oups, vous vous êtes perdus !
      </h1>
      <p className="mb-8 max-w-md text-center text-lg text-muted-foreground">
        La page <span className="font-medium text-foreground">{location.pathname}</span> n'existe
        pas. Elle a peut-être été déplacée ou supprimée.
      </p>
      <Button
        onClick={() => navigate("/")}
        size="lg"
        className="gradient-warm gap-2"
      >
        <Home className="h-5 w-5" />
        Retour aux recettes
      </Button>
    </div>
  );
};

export default NotFound;
