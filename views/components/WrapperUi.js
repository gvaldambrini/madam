import React from 'react';


// A simple stateless wrapper component which is needed to have the
// related react-router Link 'active'.
export default React.createClass({
  render: function() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});