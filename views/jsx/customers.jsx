import React from 'react';
import { Link, IndexLink, History } from 'react-router';

import { BaseForm, FormInputDate, FormInput, FormInputRadio, FormInputAndCheckbox, FormTextArea, fnSubmitForm } from './forms';
import { PopoverTemplate, InputSearch, BaseTable, BaseTableContainer } from './tables';


const CustomerFormContainer = React.createClass({
  mixins: [BaseForm],
  getInitialState: function() {
    return {
      data: {},
      errors: []
    }
  },
  componentWillMount: function() {
    if (typeof this.props.customLoad !== 'undefined') {
      this.props.customLoad(this);
      return;
    }

    if (typeof this.props.id !== 'undefined') {
      $.ajax({
        url: '/customers/' + this.props.id,
        method: 'get',
        success:
          data =>
          this.setState({
            data: data,
            errors: []
          })
      });
    }
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.doSubmit(this, this.state.data, event.currentTarget.name);
  },
  renderHtml: function(element) {
    return {
      __html: element
    }
  },
  render: function() {
    let additionalButtons;
    if (typeof this.props.submitAndAdd !== 'undefined') {
      additionalButtons = (
        <button type="button" className="btn btn-primary" name="submit-and-add"
          onClick={this.handleSubmit}>
          {this.props.submitAndAdd}
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
              <h4 className="col-sm-10 col-sm-offset-2">{this.props.formTitle}</h4>
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
              name='mobile_phone' label={i18n.customers.mobilePhone}
              cbname='allow_sms' cblabel={i18n.customers.allowSms}
              cbvalue={this.state.data.allow_sms}
              handleChange={this.handleChange}/>
            <FormInput type='tel' name='phone' value={this.state.data.phone}
              label={i18n.customers.phone} handleChange={this.handleChange}/>

            <FormInputAndCheckbox type='email' value={this.state.data.email}
              name='email' label={i18n.customers.email}
              cbname='allow_email' cblabel={i18n.customers.allowEmail}
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
              label={i18n.customers.firstSeen}
              handleChange={this.handleChange}/>
            <FormTextArea name='notes' value={this.state.data.notes}
              label={i18n.customers.notes} handleChange={this.handleChange}/>

            <div className="form-group">
              <div className="col-sm-offset-2 col-sm-10">
                <button type="button" className="btn btn-primary" name="submit" onClick={this.handleSubmit}>
                  {this.props.submitText}
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


const CustomerForm = React.createClass({
  mixins: [ History ],
  doSubmit: function(self, data, targetName) {
    const that = this;
    const editForm = typeof this.props.params.id !== 'undefined';
    const url = editForm ? `/customers/${this.props.params.id}` : '/customers';
    const method = editForm ? 'put': 'post';

    fnSubmitForm(self, url, method, data, function(obj) {
      if (targetName === 'submit-and-add') {
        that.history.pushState(
          null, `/customers/edit/${obj.id}/appointments/new`);
      }
      else {
        that.history.pushState(null, '/customers/');
      }
    });
  },
  render: function() {
    const editForm = typeof this.props.params.id !== 'undefined';
    let submitText, formTitle, submitAndAdd;

    if (editForm) {
      submitText = i18n.customers.submitEdit;
      formTitle = i18n.customers.edit;
    }
    else {
      submitText = i18n.customers.submitAdd;
      formTitle = i18n.customers.createNew;
      submitAndAdd = i18n.customers.submitAndAdd;
    }

    return (
      <CustomerFormContainer
        doSubmit={this.doSubmit}
        submitText={submitText}
        submitAndAdd={submitAndAdd}
        formTitle={formTitle}
        id={this.props.params.id}
      />
    );
  }
});


const Customer = React.createClass({
  render: function() {
    let infoLink;
    let appLink;

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
        <Link to='' className="active" onClick={function(e) {e.preventDefault();}}>
          {i18n.customers.headerInfo}
        </Link>
      );
      appLink = (
        <Link to='' className="disabled">
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


const CustomersTable = React.createClass({
  mixins: [BaseTable, History],
  deleteItem: function(objId) {
    this.deleteRow('/customers/' + objId);
  },
  render: function() {
    const that = this;
    const customerRows = this.props.data.customers.map(
      (customer, index) =>
      <tr key={customer.id} onClick={
          function(event) {
            that.history.pushState(null, `/customers/edit/${customer.id}`);
            event.preventDefault();
            event.stopPropagation();
          }
        }>
        <td dangerouslySetInnerHTML={this.renderHighlight(customer.name)} />
        <td dangerouslySetInnerHTML={this.renderHighlight(customer.surname)} />
        <td className="hidden-xs" dangerouslySetInnerHTML={this.renderHighlight(customer.phone)} />
        <td className="hidden-xs">{customer.last_seen}</td>
        <td className="no-padding">
          <span onClick={function(event) {event.stopPropagation();}} className="table-btn pull-right glyphicon glyphicon-trash"
            data-toggle="tooltip" data-placement="left" title={i18n.customers.deleteText} ref={
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
                    onConfirm: () => that.deleteItem(customer.id)
                  });
                }
              }
            }></span>
        </td>
      </tr>
    );

    return (
      <table className='table table-hover'>
        <thead>
          <tr>
            <th>{i18n.customers.name}</th>
            <th>{i18n.customers.surname}</th>
            <th className="hidden-xs">{i18n.customers.phones}</th>
            <th className="hidden-xs">{i18n.customers.lastSeen}</th>
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


const Customers = React.createClass({
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

    let customers;
    if (this.state.data.customers.length > 0) {
      customers = <CustomersTable data={this.state.data} updateTable={this.updateTable}/>;
    }
    else {
      customers = <div className="alert alert-info" role="alert">{i18n.customers.emptyTableMsg}</div>;
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


const CustomersRoot = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});


module.exports = {
  CustomerFormContainer: CustomerFormContainer,
  CustomerForm: CustomerForm,
  Customer: Customer,
  Customers: Customers,
  CustomersRoot: CustomersRoot
};