import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="h-dvh grid place-items-center">
      <div>
        <h1 className="text-8xl text-center font-extrabold text-primary">
          404
        </h1>
        <p className="text-center">
          Back to{" "}
          <Link to="/" className="underline">
            Home
          </Link>
        </p>
      </div>
    </main>
  );
};

export default NotFound;
