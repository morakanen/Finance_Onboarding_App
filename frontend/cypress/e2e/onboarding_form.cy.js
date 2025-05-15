// Cypress E2E test for onboarding Client Details Form
// Assumes app runs on http://localhost:3000 and a test user exists

describe('Onboarding Client Details Form', () => {
  const clientDetails = {
    title: 'Mr',
    firstName: 'Testy',
    middleName: '',
    lastName: 'McTestface',
    salutation: '',
    gender: 'Male',
    addressLine1: '123 Test Street',
    addressLine2: '',
    town: 'Testville',
    county: '',
    country: 'UK',
    postcode: 'TE57 1NG',
    dob: '1990-01-01',
    dod: '2025-01-01',
    vatNumber: 'GB123456789',
    niNumber: 'QQ123456C',
    utr: '1234567890',
    taxType: 'Self Assessment',
    taxInvestigationCover: 'yes',
    yearEnd: '31/03',
    isVatInvoiceRequired: 'yes',
    isStatementRequired: 'no',
    isBillingSameAddress: 'yes',
    emailCorrespondence: 'testy@example.com',
    emailFeeNote: 'fee@example.com',
    emailVatInvoice: 'vat@example.com',
    emailStatement: 'statement@example.com',
    backupEmail: 'backup@example.com',
    telephone1: '01234567890',
    telephone2: '',
    mobile: ''
  };

  before(() => {
    // Optionally, seed DB or login here
  });

  it('should fill and autosave the client details form', () => {
    cy.visit('/onboarding/client-details');
    // Fill out the form fields
    // Title (Select)
    cy.get('[data-testid="select-title"]').click();
    cy.get('[data-testid="select-title-option-Mr"]').click();

    // First Name
    cy.get('input[name="firstName"]').type(clientDetails.firstName);

    // Last Name
    cy.get('input[name="lastName"]').type(clientDetails.lastName);

    // Gender (Select)
    cy.get('[data-testid="select-gender"]').click();
    cy.get('[data-testid="select-gender-option-male"]').click();

    // Address fields
    cy.get('input[name="addressLine1"]').type(clientDetails.addressLine1);
    cy.get('input[name="town"]').type(clientDetails.town);
    cy.get('input[name="country"]').type(clientDetails.country);
    cy.get('input[name="postcode"]').type(clientDetails.postcode);

    // DOB, DOD, VAT, NI, UTR
    cy.get('input[name="dob"]').type(clientDetails.dob);
    cy.get('input[name="dod"]').type(clientDetails.dod);
    cy.get('input[name="vatNumber"]').type(clientDetails.vatNumber);
    cy.get('input[name="niNumber"]').type(clientDetails.niNumber);
    cy.get('input[name="utr"]').type(clientDetails.utr);

    // Tax Type (Select)
    cy.get('[data-testid="select-taxType"]').click();
    cy.get('[data-testid="select-taxType-option-selfAssessment"]').click();

    // Tax Investigation Cover (Select)
    cy.get('[data-testid="select-taxInvestigationCover"]').click();
    cy.get('[data-testid="select-taxInvestigationCover-option-yes"]').click();

    // Year End
    cy.get('input[name="yearEnd"]').type(clientDetails.yearEnd);

    // Is VAT Invoice Required? (Radio)
    cy.get('[data-testid="radio-isVatInvoiceRequired-yes"]').click();

    // Is Statement Required? (Radio)
    cy.get('[data-testid="radio-isStatementRequired-no"]').click();

    // Billing Address Toggle (Radio)
    cy.get('[data-testid="radio-isBillingSameAddress-yes"]').click();

    // Email and phone fields
    cy.get('input[name="emailCorrespondence"]').type(clientDetails.emailCorrespondence);
    cy.get('input[name="emailFeeNote"]').type(clientDetails.emailFeeNote);
    cy.get('input[name="emailVatInvoice"]').type(clientDetails.emailVatInvoice);
    cy.get('input[name="emailStatement"]').type(clientDetails.emailStatement);
    cy.get('input[name="backupEmail"]').type(clientDetails.backupEmail);
    cy.get('input[name="telephone1"]').type(clientDetails.telephone1);
    // Add more fields as needed

    // Wait for autosave debounce
    cy.wait(1000);

    // Reload and check that values persist
    cy.reload();
    cy.get('input[name="firstName"]').should('have.value', clientDetails.firstName);
    cy.get('input[name="lastName"]').should('have.value', clientDetails.lastName);
    cy.get('input[name="postcode"]').should('have.value', clientDetails.postcode);
    // Add more assertions as needed
  });
});
