describe "Default Meteor App" do
  before(:each) do
    # tcfg.yml config is set to localhost:3000 using Chrome
    visit('/')
  end

  specify 'the form should not exist' do
    expect(page).not_to have_content('Add a job posting')
  end

  describe 'clicking on the "Post a Job" button' do
    before do
      click_on "+"
    end

    it 'should show the accompanying form' do
      expect(page).to have_content('Add a job posting')
    end

    describe 'filling in the job title' do
      before do
        fill_in 'Job Title', with: 'Waiter'
      end

      describe 'and hitting the cancel button' do
        before do
          click_on "Cancel"
        end

        specify 'should have the required skills section not have an error' do
          expect( find('.add-job-required-skills.has-success')).not_to be_nil
        end
      end
    end
  end
end

