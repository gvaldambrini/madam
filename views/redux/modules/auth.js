// No reducer defined for this module, which only exposes the
// functions to perform the login / logout.


export function login(username, password) {
  return $.ajax({
    url: '/login',
    method: 'post',
    contentType: 'application/json',
    data: JSON.stringify({
      username,
      password
    })
  });
}

export function logout() {
  return $.ajax({
    url: '/logout',
    method: 'post',
    contentType: 'application/json'
  });
}
