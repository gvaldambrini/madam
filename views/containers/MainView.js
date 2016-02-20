import React from 'react';
import Cookies from 'js-cookie';

import { MainViewUi } from '../components';


// The main view container (the whole page).
export default React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  logout: function() {
    const that = this;
    $.ajax({
      url: '/logout',
      method: 'post',
      success: function() {
        that.context.router.push('/login');
      }
    });
  },
  render: function() {
    return (
      <MainViewUi
        showToggle={typeof Cookies.get('user') !== 'undefined'}
        currentUser={Cookies.get('user')}
        logout={this.logout}>
        {this.props.children}
      </MainViewUi>
    );
  }
});