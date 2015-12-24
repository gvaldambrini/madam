import { Link, History } from 'react-router';

import moment from 'moment';

import { BaseForm, FormInputDate, FormInput, FormTextArea } from './forms';
import { PopoverTemplate, InputSearch, BaseTableContainer, BaseTable } from './tables';


var ProductForm = React.createClass({
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
    var editForm = this.props.route.path.startsWith('edit');
    var cloneForm = this.props.route.path.startsWith('clone');
    if (this.props.params.id) {
      $.ajax({
        url: '/products/' + this.props.params.id,
        method: 'get',
        success: function(data) {
          if (cloneForm) {
            data.sold_date = moment().format(config.date_format);
            data.notes = '';
          }
          that.setState({
            data: data,
            editForm: editForm,
            errors: []
          });
        }
      });
    }
    else {
      that.setState({
        data: {
          sold_date: moment().format(config.date_format)
        },
        editForm: editForm,
        errors: []
      });
    }
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();

    var successCb = function(data) {
      this.history.pushState(null, '/products');
    };
    var url = this.state.editForm ? '/products/' + this.props.params.id : '/products';
    var method = this.state.editForm ? 'put': 'post';
    this.submitForm(url, method, successCb);
  },
  renderHtml(element) {
    return {
      __html: element
    }
  },
  render: function() {
    var submitText, formTitle;
    if (this.state.editForm) {
      submitText = i18n.products.submitEdit;
      formTitle = i18n.products.edit;
    }
    else {
      submitText = i18n.products.submitAdd;
      formTitle = i18n.products.addNew;
    }

    return (
      <div className="content-body">
        {this.renderErrors()}
        <div className="form-container" id="form-container">
          <form id="form" className="form-horizontal product" method="post">
            <div className="form-group">
              <h4 className="col-sm-10 col-sm-offset-2">{formTitle}</h4>
            </div>
            <div className="form-group">
              <div className="col-sm-10 col-sm-offset-2 mandatory-fields"
              dangerouslySetInnerHTML={this.renderHtml(i18n.products.mandatoryFields)}>
              </div>
            </div>

            <FormInput name='name' value={this.state.data.name}
              label={i18n.products.name} focus={true} mandatory={true}
              handleChange={this.handleChange}/>
            <FormInput name='brand' value={this.state.data.brand}
              label={i18n.products.brand} handleChange={this.handleChange}/>
            <FormInputDate name='sold_date' value={this.state.data.sold_date}
              label={i18n.products.sold_date} orientation='top'
              handleChange={this.handleChange}/>
            <FormTextArea name='notes' value={this.state.data.notes}
              label={i18n.products.notes}
              handleChange={this.handleChange}/>

            <div className="form-group">
              <div className="col-sm-offset-2 col-sm-10">
                <button type="submit" className="btn btn-primary" name="submit" onClick={this.handleSubmit}>
                  {submitText}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
});


var ProductsTable = React.createClass({
  mixins: [BaseTable, History],
  deleteItem: function(objId) {
    this.deleteRow('/products/' + objId);
  },
  render: function() {
    var that = this;
    var productRows = this.props.data.products.map(function(product, index) {
      var productDetails = product.objects.map(function(object) {
        return (
          <tr key={object.id} onClick={
            function(event) {
              that.history.pushState(null, '/products/edit/' + object.id);
              event.preventDefault();
              event.stopPropagation();
            }
          }>
            <td>{object.date}</td>
            <td>{object.notes}</td>
            <td className="no-padding">
              <span onClick={function(event) {event.stopPropagation();}} className="pull-right glyphicon glyphicon-trash"
                data-toggle="tooltip" data-placement="left"
                title={object.deleteText} data-obj-id={object.id} ref={
                  function(span) {
                    if (span != null) {
                      var $span = $(span);
                      if ($span.data('tooltip-init'))
                        return;
                      $span.data('tooltip-init', true);
                      $span.tooltip();
                      $span.confirmPopover({
                        template: '#popover-template',
                        title: i18n.products.deleteTitle,
                        content: i18n.products.deleteMsg,
                        $rootContainer: $('#products-table-container'),
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

      return [
        <tr key={product.name + product.brand} data-toggle="collapse" data-target={'#expanded-row' + index}>
          <td dangerouslySetInnerHTML={that.renderHighlight(product.name)} />
          <td dangerouslySetInnerHTML={that.renderHighlight(product.brand)} />
          <td>{product.count}</td>
          <td className="no-padding">
            <span className="pull-right glyphicon glyphicon-plus"
              data-toggle="tooltip" data-placement="left"
              title={product.cloneText}
              onClick={
                function(event) {
                  that.history.pushState(null, '/products/clone/' + product.objects[0].id);
                  event.preventDefault();
                  event.stopPropagation();
                }
              } ref={
                function(span) {
                  if (span !== null) {
                    $(span).tooltip();
                  }
                }
              }></span>
          </td>
        </tr>,
        <tr>
          <td colSpan={4} className="hidden-row">
            <div id={'expanded-row' + index} className="collapse">
              <table className='table table-hover'>
                  <thead data-toggle="collapse" data-target={'#expanded-row' + index}>
                    <tr>
                      <th>{product.headerDate}</th>
                      <th>{product.headerNotes}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {productDetails}
                  </tbody>
              </table>
            </div>
          </td>
        </tr>
      ];
    });

    return (
      <table className='table table-hover'>
        <thead>
          <tr>
            <th>{this.props.data.headerName}</th>
            <th>{this.props.data.headerBrand}</th>
            <th>{this.props.data.headerCount}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {productRows}
        </tbody>
      </table>
    );
  }
});


var Products = React.createClass({
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

    this.fetchData('/products/search', text);
  },
  updateTable: function() {
    this.search(this.state.filterText);
  },
  render: function() {
    var products;
    if (!this.state.loaded) {
      return <div></div>;
    }

    if (this.state.data.products.length > 0) {
      products = <ProductsTable data={this.state.data} updateTable={this.updateTable}/>;
    }
    else {
      products = <div className="alert alert-info" role="alert">{this.state.data.emptyMsg}</div>;
    }

    return (
      <div>
        <div className="content-header">
          <Link className='btn btn-primary' to="/products/new">{i18n.products.addNew}</Link>

          <InputSearch search={this.search} placeholder={i18n.products.search} />
        </div>
        <div id="products-table-container" className="content-body">
          {products}
        </div>
        <div id="popover-template">
          <PopoverTemplate confirm={i18n.products.btnConfirm} cancel={i18n.products.btnCancel}/>
        </div>
      </div>
    );
  }
});

var ProductsRoot = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});


module.exports = {
  ProductForm: ProductForm,
  Products: Products,
  ProductsRoot: ProductsRoot
};