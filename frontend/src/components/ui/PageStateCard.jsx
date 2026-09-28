import { Link } from "react-router-dom";
import Spinner from "../Spinner";
import FormMessage from "./FormMessage";

export function PageLoadingState({
  label = "Loading...",
  pageClass = "accept-invite-page",
  cardClass = "accept-invite-card",
  stateCardClass = "accept-invite-state-card",
}) {
  return (
    <main className={pageClass}>
      <div className={cardClass}>
        <div className={stateCardClass}>
          <Spinner label={label} fullScreen={false} />
        </div>
      </div>
    </main>
  );
}

export function PageErrorState({
  message = "An error occurred.",
  backLink = "/dashboard",
  backText = "Go to Dashboard",
  pageClass = "accept-invite-page",
  cardClass = "accept-invite-card",
  stateCardClass = "accept-invite-state-card",
}) {
  return (
    <main className={pageClass}>
      <div className={cardClass}>
        <div className={stateCardClass}>
          <FormMessage type="error" text={message} />
          {backLink && (
            <Link
              to={backLink}
              className="org-btn org-btn--secondary"
              style={{ marginTop: "16px" }}
            >
              {backText}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
