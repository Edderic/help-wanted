jobPostings = new Meteor.Collection('jobPostings')

if (Meteor.isClient) {
  function jobPostingFieldValues() {
    var fields =  $('.job-posting-field').map(function(item) { return $(this).val() })
    fields.reduce = Array.prototype.reduce;

    return fields;
  }

  function updateJobPostingFieldStatuses() {
    $('.job-posting-field').each(function() {
      if ($(this).val() == "") {
        Session.set(idCamelCase($(this).attr('id')) + 'Blank', true)
      } else {
        Session.set(idCamelCase($(this).attr('id')) + 'Blank', false)
      }
    })
  }

  function haveNonBlankValues(prev, curr) {
    return prev && curr != ""
  }

  function haveBlankValues(prev, curr) {
    return prev && curr === ""
  }

  function addJobPostingFieldsAllValid() {
    return jobPostingFieldValues().reduce(haveNonBlankValues, true)
  }

  function validateInputFields() {
    if (addJobPostingFieldsAllValid()) {
      jobPostings.insert({
        title: $('#job-title').val(),
        requiredSkills: $('#job-required-skills').val(),
        description: $('#job-description').val(),
      })

      Session.set('addingJobPosting', false)
    }
  }


  function idCamelCase(id) {
    return id.split("-").reduce(function(prevVal, curVal){
      return prevVal + curVal.charAt(0).toUpperCase() + curVal.slice(1)
    })
  }

  function validateInputField(e) {
    if (e.target.value == "") {
      Session.set(idCamelCase(e.target.id) + 'Blank', true)
      $(e.target.id).addClass('invalid-field')
    } else {
      $(e.target.id).removeClass('invalid-field')
      Session.set(idCamelCase(e.target.id) + 'Blank', false)
    }
  }

  Session.setDefault('jobTitleBlank', false);
  Session.setDefault('jobRequiredSkillsBlank', false);
  Session.setDefault('jobDescriptionBlank', false);
  Session.setDefault('addingJobPosting', false);
  Session.setDefault('attemptingToCancel', false);

  Template.jobPostings.helpers({
    addingJobPosting: function() {
      return Session.get('addingJobPosting');
    },

    jobPostings: function() {
      return jobPostings.find({});
    }
  });

  Template.jobPostings.events({
    'click .cancel.job-posting': function(e) {
      // set session blanks
      updateJobPostingFieldStatuses();
      if (jobPostingFieldValues().reduce(haveBlankValues, true)) {
        Session.set('addingJobPosting', false)
        Session.set('attemptingToCancel', false)
      } else {
        Session.set('attemptingToCancel', true)
      }
    },

    'click #add-job-posting': function() {
      Session.set('addingJobPosting', true)
      Session.set('attemptingToCancel', false)
      Session.set('jobTitleBlank', false)
      Session.set('jobRequiredSkillsBlank', false)
      Session.set('jobDescriptionBlank', false)

      $('#job-title').focus();
    },

    'click .job-posting#save': function(e, t) {
      updateJobPostingFieldStatuses();
      Session.set('attemptingToCancel', false);
      validateInputFields();
    },

    'keyup .job-posting-field': function(e,t) {
      Session.set('attemptingToCancel', false)
      validateInputField(e)
    },

    'focusout .job-posting-field': function(e,t) {
      validateInputField(e)
    }
  })

 var jobPostingHelpers = {
    jobTitleBlankAndNotCancelling: function() {
      return Session.get('jobTitleBlank') &&
        Session.equals('attemptingToCancel', false)
    },

    jobTitleNotBlankAndCancelling: function() {
      return Session.equals('jobTitleBlank', false) &&
        Session.equals('attemptingToCancel', true)
    },

    jobRequiredSkillsBlankAndNotCancelling: function() {
      return Session.get('jobRequiredSkillsBlank') &&
        Session.equals('attemptingToCancel', false)
    },

    jobRequiredSkillsNotBlankAndCancelling: function() {
      return Session.equals('jobRequiredSkillsBlank', false) &&
        Session.equals('attemptingToCancel', true)
    },

    jobDescriptionBlankAndNotCancelling: function() {
      return Session.get('jobDescriptionBlank') &&
        Session.equals('attemptingToCancel', false)
    },

    jobDescriptionNotBlankAndCancelling: function() {
      return Session.equals('jobDescriptionBlank', false) &&
        Session.equals('attemptingToCancel', true)
    },

    jobTitleFieldValidateClass: function() {
      if ( jobPostingHelpers.jobTitleBlankAndNotCancelling() ||
          jobPostingHelpers.jobTitleNotBlankAndCancelling()) {
        return 'invalid-field'
      } else {
        ""
      }
    },
    jobRequiredSkillsFieldValidateClass: function() {
      if ( jobPostingHelpers.jobRequiredSkillsBlankAndNotCancelling() ||
          jobPostingHelpers.jobRequiredSkillsNotBlankAndCancelling()) {
        return 'invalid-field'
      } else {
        ""
      }
    },

    jobDescriptionFieldValidateClass: function() {
      if ( jobPostingHelpers.jobDescriptionBlankAndNotCancelling() ||
          jobPostingHelpers.jobDescriptionNotBlankAndCancelling()) {
        return 'invalid-field'
      } else {
        ""
      }
    }
  }
  Template.jobPosting.helpers(jobPostingHelpers)
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
