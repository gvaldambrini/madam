import React from 'react';


function fnRenderErrors(errors) {
  if (errors.length === 0) {
    return errors;
  }

  const errorMessages = errors.map(err => <li key={err}>{err}</li>);
  return (
    <div className="alert alert-danger">
      <ul>
        {errorMessages}
      </ul>
    </div>
  );
}

module.exports = {
  fnRenderErrors: fnRenderErrors
};