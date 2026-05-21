import Button from "../Button.jsx";

const ErrorState = ({ title = "Something went wrong", message, onRetry, backAction }) => (
  <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100">
    <p className="font-bold text-white">{title}</p>
    <p className="mt-2 leading-6">{message || "We could not load this section. Please try again."}</p>
    {onRetry || backAction ? (
      <div className="mt-4 flex flex-wrap gap-2">
        {onRetry ? (
          <Button type="button" variant="danger" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        {backAction}
      </div>
    ) : null}
  </div>
);

export default ErrorState;
