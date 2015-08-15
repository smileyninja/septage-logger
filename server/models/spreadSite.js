/**
 * Created by chrismorgan on 5/26/15.
 */
var mongoose = require('mongoose');

var schema = mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    contactName: {type: String, required: true},
    phone: {type: String, required: true},
    nitro: {type: Number, required: true},
    acres: {type: Number, required: true},
    approvedCompanies: [{ type: String }]
});


module.exports = mongoose.model('SpreadSite', schema);