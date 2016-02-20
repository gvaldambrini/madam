import { browserHistory } from 'react-router';


function fnSubmitForm(self, url, method, data, successCb) {
  const that = self;

  $.ajax({
    url: url,
    method: method,
    contentType: 'application/json',
    data: JSON.stringify(data),
    success: successCb,
    error: function(xhr, textStatus, _errorThrown) {
      if (xhr.status === 401) {
        browserHistory.push('/login');
      }

      const errors = [];
      for (let i = 0; i < xhr.responseJSON.errors.length; i++) {
        errors[errors.length] = xhr.responseJSON.errors[i].msg;
      }
      that.setState({
        errors: errors
      });
    }

  });
}


function fnFetchData(self, url, filterText) {
  const that = self;
  const ajaxArgs = {
    url: url,
    success:
      data =>
      that.setState({
        data: data,
        loaded: true
      }),
    error: function(xhr, textStatus, _errorThrown) {
      if (xhr.status === 401) {
        browserHistory.push('/login');
      }
    }
  };
  if (typeof filterText !== 'undefined') {
    ajaxArgs.data = {text: filterText};
  }
  $.ajax(ajaxArgs);
}


module.exports = {
  fnSubmitForm: fnSubmitForm,
  fnFetchData: fnFetchData
};