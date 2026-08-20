import React from "react";

export const Form = ({title="form title",footerText="Footer:do?",footerAction="go",footerOnAction,onSubmit,children}) => {
  return (
    <div className="text-center user-select-none p-2">
      <h1 className="text-center display-6 w-100">{title}</h1>
      <form className="d-flex flex-column p-3 justify-arround gap-3" onSubmit={onSubmit}>
        {children}
      </form>
      <span>
        {footerText}{" "}
        <a href="#" onClick={(e)=>{
            e.preventDefault();
            if(footerOnAction&&typeof footerOnAction === "function") {
                return footerOnAction();
            }
            console.log("form footer action clicked");
        }}>
          {footerAction}
        </a>
      </span>
    </div>
  );
};
