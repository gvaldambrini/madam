module.exports = {
  beforeEach: function(browser) {
    browser
      .url('http://localhost:7890')
      .waitForElementVisible('body', 1000)
      .page.Login().authenticate('admin', 'pwdadmin')
      .page.Sidebar().goToCustomers();
  },

  'Create customer, workers and services': function(browser) {
    browser
      .page.Customers().createCustomer()
      .page.Customer().fillForm({
        name: 'Tyrion',
        surname: 'Lannister'})
      .page.Customer().submitAndAdd()

      .page.Appointments().alertContains(
        'To create an appointment, you have first to define the workers.')
      .page.Appointments().followAlertLink()
      .page.Workers().enableEdit()
      .page.Workers().set(0, {name: 'Cersei', color: '#fdd017'})
      .page.Workers().add()
      .page.Workers().set(1, {name: 'Daenerys', color: '#ff0000'})
      .page.Workers().add()
      .page.Workers().set(2, {name: 'Margaery', color: '#4dbd33'})
      .page.Workers().save()
      .page.Sidebar().goToCustomers()
      .page.Customers().editCustomer(0)
      .page.Customer().goToAppointments()
      .page.Appointments().createAppointment()

      .page.Appointments().alertContains(
        'To create an appointment, you have first to define the common services.')
      .page.Appointments().followAlertLink()
      .page.Services().enableEdit()
      .page.Services().set(0, 'shampoo')
      .page.Services().add()
      .page.Services().set(1, 'haircut')
      .page.Services().save()
      .end();
  },

  'Create appointments': function(browser) {
    browser
      .page.Customers().tableContains(0, 'Tyrion', 'Lannister', '-', '-')
      .page.Customers().editCustomer(0)
      .page.Customer().goToAppointments()
      .page.Appointments().createAppointment()

      .page.Appointments().alertNotPresent()
      .page.Appointment().submit()
      .page.Appointment().alertContains('At least one service is mandatory')

      .page.Appointment().toggleService(0)
      .page.Appointment().toggleService(1)
      .page.Appointment().setDate('20/09/2015')
      .page.Appointment().submit()
      .page.Appointments().tableCount(1)
      .page.Appointments().tableContains(0, '20/09/2015', 'shampoo - haircut')

      .page.Appointments().createAppointment()
      .page.Appointment().addService()
      .page.Appointment().setService(1, 'super haircut')
      .page.Appointment().setService(2, 'permanent')
      .page.Appointment().toggleService(0)
      .page.Appointment().switchWorker(0)
      .page.Appointment().toggleService(1)
      .page.Appointment().selectWorker(2, 'Margaery')
      .page.Appointment().setDate('14/09/2015')
      .page.Appointment().submit()
      .page.Appointments().tableCount(2)
      .page.Appointments().tableContains(1, '14/09/2015', 'shampoo - super haircut - permanent')
      .end();
  },

  'Edit an appointment': function(browser) {
    browser
      .page.Customers().tableContains(0, 'Tyrion', 'Lannister', '-', '20/09/2015')
      .page.Customers().editCustomer(0)
      .page.Customer().goToAppointments()
      .page.Appointments().editAppointment(1)
      .page.Appointment().expectedWorker(0, 'Daenerys')
      .page.Appointment().expectedWorker(1, 'Cersei')
      .page.Appointment().expectedWorker(2, 'Margaery')
      .page.Appointment().toggleService(1)
      .page.Appointment().addService()
      .page.Appointment().setService(2, 'strong permanent')
      .page.Appointment().setService(3, 'color')
      .page.Appointment().setDate('21/09/2015')
      .page.Appointment().submit()
      .page.Appointments().tableContains(0, '21/09/2015', 'shampoo - strong permanent - color')
      .page.Appointments().tableContains(1, '20/09/2015', 'shampoo - haircut')
      .page.Appointments().tableCount(2)
      .end();
  },

  'Edit the customer, the appointments are still there': function(browser) {
    browser
      .page.Customers().tableContains(0, 'Tyrion', 'Lannister', '-', '21/09/2015')
      .page.Customers().editCustomer(0)
      .page.Customer().fillForm({
        name: 'Tyrion',
        surname: 'Lannister',
        email: 'tyrion@casterlyrock.com'})
      .page.Customer().submit()
      .page.Customers().editCustomer(0)
      .page.Customer().goToAppointments()
      .page.Appointments().tableContains(0, '21/09/2015', 'shampoo - strong permanent - color')
      .page.Appointments().tableContains(1, '20/09/2015', 'shampoo - haircut')
      .page.Appointments().tableCount(2)
      .end();
  },

  'Delete all the appointments': function(browser) {
    browser
      .page.Customers().tableContains(0, 'Tyrion', 'Lannister', '-', '21/09/2015')
      .page.Customers().editCustomer(0)
      .page.Customer().goToAppointments()
      .page.Appointments().deleteAppointment(1)
      .pause(100)
      .page.Appointments().tableCount(1)
      .page.Appointments().tableContains(0, '21/09/2015', 'shampoo - strong permanent - color')
      .page.Appointments().deleteAppointment(0)
      .page.Sidebar().goToCustomers()
      .page.Customers().tableContains(0, 'Tyrion', 'Lannister', '-', '-')
      .end();
  }
};