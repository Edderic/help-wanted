jobPostings = new Meteor.Collection('jobPostings')

if (Meteor.isClient) {
  // counter starts at 0
  function validateInputField(e) {
    var idCamelCase = e.target.id.split("-").reduce(function(prevVal, curVal){
      return prevVal + curVal.charAt(0).toUpperCase() + curVal.slice(1)
    })

    if (e.target.value == "") {
      Session.set(idCamelCase + 'Blank', true)
      $(e.target.id).addClass('invalid-field')
    } else {
      $(e.target.id).removeClass('invalid-field')
      Session.set(idCamelCase + 'Blank', false)
    }
  }

  Session.setDefault('jobTitleBlank', false);
  Session.setDefault('jobRequiredSkillsBlank', false);
  Session.setDefault('jobDescriptionBlank', false);
  Session.setDefault('addingJobPosting', false);

  Template.jobPostings.helpers({
    addingJobPosting: function() {
      return Session.get('addingJobPosting');
    },

    jobPostings: function() {
      return jobPostings.find({});
    }
  });

  Template.jobPostings.events({
    'click #add-job-posting': function() {
      Session.set('addingJobPosting', true)
      $('#job-title').focus();
    },

    'click .job-posting#save': function(e, t) {
      var title = $('#job-title').val()
      var requiredSkills = $('#job-required-skills').val()
      var description = $('#job-description').val()

      if (title && requiredSkills && description) {
        jobPostings.insert({
          title: title,
          requiredSkills: requiredSkills,
          description: description,
        })

        Session.set('addingJobPosting', false)
      }
    },

    'keyup .job-posting-field': function(e,t) {
      validateInputField(e)
    },

    'focusout .job-posting-field': function(e,t) {
      validateInputField(e)
    }
  })

  Template.jobPosting.helpers({
    jobTitleBlank: function() {
      return Session.get('jobTitleBlank')
    },
    jobRequiredSkillsBlank: function() {
      return Session.get('jobRequiredSkillsBlank')
    },
    jobDescriptionBlank: function() {
      return Session.get('jobDescriptionBlank')
    },
    jobTitleFieldValidateClass: function() {
      return Session.get('jobTitleBlank') ? 'invalid-field' : ''
    },
    jobRequiredSkillsFieldValidate: function() {
      return Session.get('jobRequiredSkillsBlank') ? 'invalid-field' : ''
    },
    jobDescriptionFieldValidateClass: function() {
      return Session.get('jobDescriptionBlank') ? 'invalid-field' : ''
    }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
