var Link = require('react-router').Link;
var IndexLink = require('react-router').IndexLink;
var History = require('react-router').History;

var BaseForm = require('./forms').BaseForm;
var FormInputDate = require('./forms').FormInputDate;
var FormInput = require('./forms').FormInput;
var FormInputRadio = require('./forms').FormInputRadio;
var FormInputAndCheckbox = require('./forms').FormInputAndCheckbox;
var FormTextArea = require('./forms').FormTextArea;

var PopoverTemplate = require('./tables').PopoverTemplate;
var InputSearch = require('./tables').InputSearch;
var BaseTable = require('./tables').BaseTable;
var BaseTableContainer = require('./tables').BaseTableContainer;


var CustomerForm = React.createClass({
  mixins: [BaseForm, History],
  getInitialState: function() {
    return {
      data: {},
      editForm: false,
      errors: []
    }
  },
  componentWillMount: function() {
    var that = this;
    if (this.props.params.id) {
      $.ajax({
        url: '/customers/' + this.props.params.id,
        method: 'get',
        success: function(data) {
          that.setState({
            data: data,
            editForm: true,
            errors: []
          });
        }
      });
    }
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();

    var targetName = event.currentTarget.name;
    var url = this.state.editForm ? '/customers/' + this.props.params.id : '/customers';
    var method = this.state.editForm ? 'put': 'post';

    var successCb = function(data) {
      if (targetName === 'submit-and-add') {
        this.history.pushState(null, '/customers/edit/' + data.id + '/appointments/new');
      }
      else {
        this.history.pushState(null, '/customers/');
      }
    };
    this.submitForm(url, method, successCb);
  },
  renderHtml: function(element) {
    return {
      __html: element
    }
  },
  render: function() {
    var submitText, formTitle;
    if (this.state.editForm) {
      submitText = i18n.customers.submitEdit;
      formTitle = i18n.customers.edit;
    }
    else {
      submitText = i18n.customers.submitAdd;
      formTitle = i18n.customers.createNew;
    }

    var additionalButtons;
    if (!this.state.editForm) {
      additionalButtons = (
        <button type="button" className="btn btn-primary" name="submit-and-add"
          onClick={this.handleSubmit}>
          {i18n.customers.submitAndAdd}
        </button>
      )
    }
    return (
      <div className="content-body">
        {this.renderErrors()}
        <div className="form-container" id="form-container">
          <form id="form" className="form-horizontal customer" method="post"
            action=''>
            <div className="form-group">
              <h4 className="col-sm-10 col-sm-offset-2">{formTitle}</h4>
            </div>
            <div className="form-group">
              <div className="col-sm-10 col-sm-offset-2 mandatory-fields"
                dangerouslySetInnerHTML={this.renderHtml(i18n.customers.mandatoryFields)}>
              </div>
            </div>
            <FormInput name='name' value={this.state.data.name}
              label={i18n.customers.name} focus={true} mandatory={true}
              handleChange={this.handleChange}/>
            <FormInput name='surname' value={this.state.data.surname}
              label={i18n.customers.surname} handleChange={this.handleChange}/>
            <FormInputAndCheckbox type='tel' value={this.state.data.mobile_phone}
              name='mobile_phone' label={i18n.customers.mobile_phone}
              cbname='allow_sms' cblabel={i18n.customers.allow_sms}
              cbvalue={this.state.data.allow_sms}
              handleChange={this.handleChange}/>
            <FormInput type='tel' name='phone' value={this.state.data.phone}
              label={i18n.customers.phone} handleChange={this.handleChange}/>

            <FormInputAndCheckbox type='email' value={this.state.data.email}
              name='email' label={i18n.customers.email}
              cbname='allow_email' cblabel={i18n.customers.allow_email}
              cbvalue={this.state.data.allow_email}
              handleChange={this.handleChange}/>

            <FormInputRadio name='discount' label={i18n.customers.discount}
              values={[
                {name: '0%',  value: '0'},
                {name: '10%', value: '10'},
                {name: '20%', value: '20'},
                {name: '30%', value: '30'}]}
              value={this.state.data.discount}
              handleChange={this.handleChange}/>

            <FormInputDate name='first_seen' value={this.state.data.first_seen}
              label={i18n.customers.first_seen}
              handleChange={this.handleChange}/>
            <FormTextArea name='notes' value={this.state.data.notes}
              label={i18n.customers.notes} handleChange={this.handleChange}/>

            <div className="form-group">
              <div className="col-sm-offset-2 col-sm-10">
                <button type="button" className="btn btn-primary" name="submit" onClick={this.handleSubmit}>
                  {submitText}
                </button>
                {additionalButtons}
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
});


var Customer = React.createClass({
  render: function() {
    var infoLink;
    var appLink;

    if (this.props.location.pathname.startsWith('/customers/edit')) {
      infoLink = (
        <IndexLink to={`/customers/edit/${this.props.params.id}/`} activeClassName="active">
          {i18n.customers.headerInfo}
        </IndexLink>
      );
      appLink = (
        <Link to={`/customers/edit/${this.props.params.id}/appointments`} activeClassName="active">
          {i18n.customers.headerAppointments}
        </Link>
      );
    }
    else {
      infoLink = (
        <Link to='/customers' className="active" onClick={function(e) {e.preventDefault();}}>
          {i18n.customers.headerInfo}
        </Link>
      );
      appLink = (
        <Link to='/customers' className="disabled">
          {i18n.customers.headerAppointments}
        </Link>
      );
    }

    return (
      <div>
        <div className="content-header">
            <ul>
                <li role="presentation">
                    {infoLink}
                </li>
                <li role="presentation">
                    {appLink}
                </li>
            </ul>
        </div>
        {this.props.children}
      </div>
    );
  }
});


var CustomersTable = React.createClass({
  mixins: [BaseTable, History],
  deleteItem: function(objId) {
    this.deleteRow('/customers/' + objId);
  },
  render: function() {
    var that = this;
    var customerRows = this.props.data.customers.map(function(customer, index) {
      return (
        <tr key={customer.id} onClick={
            function(event) {
              that.history.pushState(null, '/customers/edit/' + customer.id);
              event.preventDefault();
              event.stopPropagation();
            }
          }>
          <td dangerouslySetInnerHTML={that.renderHighlight(customer.name)} />
          <td dangerouslySetInnerHTML={that.renderHighlight(customer.surname)} />
          <td className="hidden-xs" dangerouslySetInnerHTML={that.renderHighlight(customer.phone)} />
          <td className="hidden-xs">{customer.last_seen}</td>
          <td className="no-padding">
            <span onClick={function(event) {event.stopPropagation();}} className="pull-right glyphicon glyphicon-trash"
              data-toggle="tooltip" data-placement="left"
              title={customer.deleteText} data-obj-id={customer.id} ref={
                function(span) {
                  if (span != null) {
                    var $span = $(span);
                    if ($span.data('tooltip-init'))
                      return;
                    $span.data('tooltip-init', true);
                    $span.tooltip();
                    $span.confirmPopover({
                      template: '#popover-template',
                      title: i18n.customers.deleteTitle,
                      content: i18n.customers.deleteMsg,
                      $rootContainer: $('#customers-table-container'),
                      onConfirm: function() {
                        that.deleteItem($span.data('obj-id'));
                      }
                    });
                  }
                }
              }></span>
          </td>
        </tr>
      );
    });

    return (
      <table className='table table-hover'>
        <thead>
          <tr>
            <th>{this.props.data.headerName}</th>
            <th>{this.props.data.headerSurname}</th>
            <th className="hidden-xs">{this.props.data.headerPhone}</th>
            <th className="hidden-xs">{this.props.data.headerLastSeen}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customerRows}
        </tbody>
      </table>
    );
  }
});


var Customers = React.createClass({
  mixins: [BaseTableContainer, History],
  getInitialState: function() {
    return {
      data: [],
      loaded: false,
      filterText: ''
    };
  },
  componentWillMount: function() {
    this.updateTable();
  },
  search: function(text) {
    this.setState({
      filterText: text
    });

    this.fetchData('/customers/search', text);
  },
  updateTable: function() {
    this.search(this.state.filterText);
  },
  render: function() {
    if (!this.state.loaded) {
      return <div></div>
    }

    var customers;
    if (this.state.data.customers.length > 0) {
      customers = <CustomersTable data={this.state.data} updateTable={this.updateTable}/>;
    }
    else {
      customers = <div className="alert alert-info" role="alert">{this.state.data.emptyMsg}</div>;
    }

    return (
      <div>
        <div className="content-header">
          <Link to='/customers/new' className='btn btn-primary'>{i18n.customers.createNew}</Link>
          <InputSearch search={this.search} placeholder={i18n.customers.search}/>
        </div>
        <div id="customers-table-container" className="content-body">
          {customers}
        </div>
        <div id="popover-template">
          <PopoverTemplate confirm={i18n.customers.btnConfirm} cancel={i18n.customers.btnCancel}/>
        </div>
      </div>
    );
  }
});


var CustomersRoot = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});


module.exports = {
  CustomerForm: CustomerForm,
  Customer: Customer,
  Customers: Customers,
  CustomersRoot: CustomersRoot
};