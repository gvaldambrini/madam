import React from 'react';
import Cookies from 'js-cookie';

import { logout } from '../redux/modules/auth';
import { MainViewUi } from '../components';


// The main view container (the whole page).
const MainView = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  logout: function() {
    logout().then(() => this.context.router.push('/login'));
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


export default MainView;
