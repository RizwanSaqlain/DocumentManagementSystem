const mongoose = require('mongoose');
const { Schema } = mongoose;

const PersonalDetailsSchema = new Schema({
    candidateId: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, required: true },
    domicile: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    casteCategory: { type: String, required: true },
    subCasteCategory: { type: String },
    physicallyDisabled: { type: String },
    aadharDetails: { type: String },
    photo: { type: String },  // Store image URL or path
    signature: { type: String }  // Store signature image URL or path
});

const FamilyIncomeDetailsSchema = new Schema({
    fatherName: { type: String, required: true },
    fatherOccupation: { type: String, required: true },
    fatherDesignation: { type: String },
    fatherMobileNumber: { type: String, required: true },
    motherName: { type: String, required: true },
    motherOccupation: { type: String, required: true },
    motherDesignation: { type: String },
    motherMobileNumber: { type: String, required: true },
    familyAnnualIncome: { type: String, required: true }
});

const AddressContactDetailsSchema = new Schema({
    mobileNumber: { type: String, required: true, match: /^[0-9]{10}$/ }, // Example regex for 10-digit phone numbers
    alternateMobileNumber: { type: String, match: /^[0-9]{10}$/ },
    emailAddress: { type: String, required: true, match: /.+\@.+\..+/ }, // Simple regex for email validation
    alternateEmailAddress: { type: String, match: /.+\@.+\..+/ },
    permanentHouseNo: { type: String, required: true },
    permanentStreet: { type: String, required: true },
    currentHouseNo: { type: String },
    currentStreet: { type: String }
});

const PersonalDetails = mongoose.model('PersonalDetails', PersonalDetailsSchema);
const FamilyIncomeDetails = mongoose.model('FamilyIncomeDetails', FamilyIncomeDetailsSchema);
const AddressContactDetails = mongoose.model('AddressContactDetails', AddressContactDetailsSchema);

module.exports = {
    PersonalDetails,
    FamilyIncomeDetails,
    AddressContactDetails
};
