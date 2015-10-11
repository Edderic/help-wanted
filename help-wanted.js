jobPostings = new Meteor.Collection('jobPostings')

if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);
  Session.setDefault('addingJobPosting', false);

  Template.jobPostings.helpers({
    addingJobPosting: function() {
      return Session.get('addingJobPosting');
    }
  });

  Template.jobPostings.events({
    'click #add-job-posting': function() {
      Session.set('addingJobPosting', true)
    },
  })


}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
