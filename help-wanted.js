jobPostings = new Meteor.Collection('jobPostings')

if (Meteor.isClient) {
  Meteor.subscribe('jobPostings')
  calculateCoords();

  function calculateCoords() {
    var options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }

    function success(pos) {
      var crd = pos.coords;
      var originCoords = String(crd.latitude + "," + crd.longitude)
      Session.set('coordinates', originCoords);
    }

    window.navigator.geolocation.getCurrentPosition(success)
  }

  function jobPostingInputs(inputs, method, args) {
    var fields =  inputs.map(function(item) {
      if (args === undefined) {
        return $(this)[method]()
      }
      return $(this)[method](args)
    })
    fields.reduce = Array.prototype.reduce;

    return fields;
  }

  function requiredSkillsObject() {
    var inputs = jobPostingRequiredSkillsInputs();
    inputs.reduce = Array.prototype.reduce;

    return inputs.reduce(function(prev, curr){
      prev[$(curr).attr('id')] = $(curr).is(':checked');
      return prev;
    }, {})
  }

  function jobPostingFieldValues() {
    return jobPostingInputs($('.job-posting-field'), 'val')
  }

  function jobPostingRequiredSkills() {
    return $('.add-job-required-skills input');
  }

  function jobPostingRequiredSkillsIsChecked() {
    return jobPostingInputs(jobPostingRequiredSkills(), 'is', ':checked')
  }

  function jobPostingRequiredSkillsInputs() {
    return $('.add-job-required-skills input');
  }

  function updateJobPostingFieldStatuses() {
    $('.job-posting-field').each(function() {
      if ($(this).val() == "") {
        Session.set(idCamelCase($(this).attr('id')) + 'Blank', true)
      } else {
        Session.set(idCamelCase($(this).attr('id')) + 'Blank', false)
      }
    })

    if (jobPostingRequiredSkillsHaveAtLeastOneSelected()) {
      Session.set('jobRequiredSkillsBlank', false)
    } else {
      Session.set('jobRequiredSkillsBlank', true)
    }
  }

  function addJobPostingCancellable() {
    return jobPostingFieldValues().reduce(haveBlankValues, true) &&
      !jobPostingRequiredSkillsHaveAtLeastOneSelected();
  }

  function haveNonBlankValues(prev, curr) {
    return prev && curr != ""
  }

  function haveBlankValues(prev, curr) {
    return prev && curr === ""
  }

  function haveAtLeastOneSelected(prev, curr) {
    return prev || curr === true
  }

  function jobPostingRequiredSkillsHaveAtLeastOneSelected() {
    return jobPostingRequiredSkillsIsChecked().reduce(haveAtLeastOneSelected, false)
  }

  function addJobPostingFieldsAllValid() {
    return jobPostingFieldValues().reduce(haveNonBlankValues, true) &&
      jobPostingRequiredSkillsHaveAtLeastOneSelected();
  }

  function addJobPostingFieldsAllBlank() {
    return jobPostingFieldValues().reduce(haveBlankValues, true)
  }

  function validateInputFields() {
    if (addJobPostingFieldsAllValid()) {
      var address = $('#job-address').val()
      Meteor.call('geocode', address, function(error, result) {
        console.log("result.data", result.data);
        var firstResult = result.data.results[0]
        var coordinates = firstResult.geometry.location

        jobPostings.insert({
          title: $('#job-title').val(),
          address: address,
          coordinates: coordinates,
          requiredSkills: requiredSkillsObject(),
          description: $('#job-description').val(),
          createdAt: Date()
        })

        Session.set('addingJobPosting', false)
      })
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
    } else {
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
    'click #add-job-posting': function() {
      Session.set('addingJobPosting', true)
      Session.set('attemptingToCancel', false)
      Session.set('jobTitleBlank', false)
      Session.set('jobRequiredSkillsBlank', false)
      Session.set('jobDescriptionBlank', false)

      $('#job-title').focus();
    },

    'click .job-posting-btn#save': function(e, t) {
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
    jobTitleHelpBlockContent: function() {
      if (jobPostingHelpers.jobTitleBlankAndNotCancelling()) {
        return 'cannot be empty'
      } else if (jobPostingHelpers.jobTitleNotBlankAndCancelling()) {
        return 'must be non-empty when cancelling'
      } else {
        return ''
      }
    },

    // should delete the Cancelling parts
    jobAddressHelpBlockContent: function() {
      if (jobPostingHelpers.jobAddressBlankAndNotCancelling()) {
        return 'cannot be empty'
      } else if (jobPostingHelpers.jobAddressNotBlankAndCancelling()) {
        return 'must be non-empty when cancelling'
      } else {
        return ''
      }
    },

    jobRequiredSkillsHelpBlockContent: function() {
      if (jobPostingHelpers.jobRequiredSkillsBlankAndNotCancelling()) {
        return 'cannot be empty'
      } else if (jobPostingHelpers.jobRequiredSkillsNotBlankAndCancelling()) {
        return 'must be non-empty when cancelling'
      } else {
        return ''
      }
    },

    jobDescriptionHelpBlockContent: function() {
      if (jobPostingHelpers.jobDescriptionBlankAndNotCancelling()) {
        return 'cannot be empty'
      } else if (jobPostingHelpers.jobDescriptionNotBlankAndCancelling()) {
        return 'must be non-empty when cancelling'
      } else {
        return ''
      }
    },

    jobAddressBlankAndNotCancelling: function() {
      return Session.get('jobAddressBlank') &&
        Session.equals('attemptingToCancel', false)
    },

    jobAddressNotBlankAndCancelling: function() {
      return Session.equals('jobAddressBlank', false) &&
        Session.equals('attemptingToCancel', true)
    },


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
        return 'has-error'
      } else if(addJobPostingFieldsAllBlank()){
      } else {
        return 'has-success'
      }
    },
    jobRequiredSkillsFieldValidateClass: function() {
      if ( jobPostingHelpers.jobRequiredSkillsBlankAndNotCancelling() ||
          jobPostingHelpers.jobRequiredSkillsNotBlankAndCancelling()) {
        return 'has-error'
      } else if(addJobPostingFieldsAllBlank()){
      } else {
        return 'has-success'
      }
    },

    jobDescriptionFieldValidateClass: function() {
      if ( jobPostingHelpers.jobDescriptionBlankAndNotCancelling() ||
          jobPostingHelpers.jobDescriptionNotBlankAndCancelling()) {
        return 'has-error'
      } else if(addJobPostingFieldsAllBlank()){
      } else {
        return 'has-success'
      }
    },

    jobAddressValidateClass: function() {
      if ( jobPostingHelpers.jobAddressBlankAndNotCancelling() ||
          jobPostingHelpers.jobAddressNotBlankAndCancelling()) {
        return 'has-error'
      } else if(addJobPostingFieldsAllBlank()){
      } else {
        return 'has-success'
      }
    }
  }

  Template.jobPosting.helpers(jobPostingHelpers);

  Template.jobPostingListItem.helpers({
    active: true
  })

  Template.jobPostingListItem.created=function(){
    this.showMode = new ReactiveVar(false);
    this.calculatedDistance = new ReactiveVar("");
    this.showMapsMode = new ReactiveVar("Directions")
  };

  var jobPostingListItemHelpers = {
    distance: function() {
      var instance = Template.instance();
      var destination = jobPostingListItemHelpers.encodedAddress.apply(this);

      // Only calculate if the coordinates already exist and distance has not been calculated
      if (Session.get('coordinates') && !instance.calculatedDistance.get()) {
        Meteor.call('getDistance', Session.get('coordinates'), destination, function(error, result) {
          console.log(result)
          var data = result.data;
          var dist = data.rows[0].elements[0].distance.text
          instance.calculatedDistance.set(dist);
        })
      }

      return Template.instance().calculatedDistance.get() || "";
    },
    encodedAddress: function() {
      return encodeURI(this.address);
    },
    encodedUserAddress: function() {

      // Setting should be geolocation
      // or it could be a set address
      return Session.get('coordinates') || ""
    },

    mapsURI: function() {
      var _self = this;
      var apiKey = Meteor.settings.public.google_maps_embed_api_key
      if (jobPostingListItemHelpers.encodedUserAddress()) {
        if (Template.instance().showMapsMode.get() == 'Directions') {
          var uri = "https://www.google.com/maps/embed/v1/directions?key="+ apiKey + "&origin=" +
          jobPostingListItemHelpers.encodedUserAddress() +
            "&destination=" +
            jobPostingListItemHelpers.encodedAddress.apply(_self);

          return uri
        } else {
          var crd = _self.coordinates;
          var uri = "https://www.google.com/maps/embed/v1/streetview?key="+ apiKey + "&location=" +
            crd.lat + "," + crd.lng
          return uri
        }
      } else {
        return ""
      }
    },

    streetViewActive: function() {
      return Template.instance().showMapsMode.get() == 'Streetview' ? 'active' : ''
    },
    directionsActive: function() {
      return Template.instance().showMapsMode.get() == 'Directions' ? 'active' : ''
    },
    showMode:function(){
      return Template.instance().showMode.get();
    },
    skillsRequired: function() {
      var arrayifiedRequiredSkills = _.pairs(this.requiredSkills)
      arrayifiedRequiredSkills.reduce = Array.prototype.reduce
      return arrayifiedRequiredSkills.reduce(function(prev, curr){
        if (curr[1]) {
          prev.push(curr[0]);
        }
        return prev;
      }, [])
    }
  }

  Template.jobPostingListItem.helpers(jobPostingListItemHelpers);


  Template.jobPostingListItem.events({
    'click .list-group-item.summary-view': function(event,template) {
      var showMode = template.showMode.get();
      template.showMode.set(!showMode);
    },

    'click .directions': function(event,template) {
      event.preventDefault();
      template.showMapsMode.set('Directions');
    },

    'click .streetview': function(event,template) {
      event.preventDefault();
      template.showMapsMode.set('Streetview');
    }
  });

  Template.cancelAddJobPostingModal.events({
    'click .confirm': function(e,t) {
      // set session blanks
      updateJobPostingFieldStatuses();
      Session.set('addingJobPosting', false)
      Session.set('attemptingToCancel', false)
    }
  })
}

if (Meteor.isServer) {
  Meteor.publish('jobPostings', function() {
    return jobPostings.find({}, {sort: {createdAt: -1}});
  })

  Meteor.startup(function () {
    // code to run on server at startup
    //
    Meteor.methods({
      getDistance: function(origin, destination) {
        var key = Meteor.settings.google_maps_distance_matrix_api_key;
        var url = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins="+ origin + "&destinations=" + destination + "&key=" + key

        return Meteor.http.get(url);
      },
      geocode: function(address) {
        var key = Meteor.settings.google_maps_geolocation_api_key;
        var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURI(address) + "&key=" + key
        return Meteor.http.get(url);
      }
    })

    if (jobPostings.find().count() == 0) {
      jobPostings.insert(
        { "title" : "Maid",
          "requiredSkills" : {
            "anything" : false,
            "cleaning" : true,
            "construction" : false,
            "cooking" : true,
            "driving" : false,
            "house_help" : false,
            "landscaping" : false,
            "nail_salon" : false,
            "other" : false
          },
          "description" : "We are looking for someone to clean our house.",
          "createdAt" : "Sat Oct 16 2015 13:06:08 GMT-0400 (EDT)",
          "address" : "123 Main Street, Princeton, NJ"
        }
      )

      jobPostings.insert(
        { "title" : "Janitor",
          "requiredSkills" : {
            "anything" : false,
            "cleaning" : true,
            "construction" : false,
            "cooking" : false,
            "driving" : false,
            "house_help" : false,
            "landscaping" : false,
            "nail_salon" : false,
            "other" : false
          },
          "description" : "XYZ Properties is looking for someone to maintain the high-cleaning standards of our office.",
          "createdAt" : "Sat Oct 17 2015 14:06:08 GMT-0400 (EDT)",
          "address" : "601 Raritan Avenue, Highland Park, NJ 08904"
        }
      )
    }

  });
}
