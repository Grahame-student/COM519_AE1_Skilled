const Employee = require('../../../models/Employee');

exports.list = async (req, res, next) => {
  console.log('Requesting list of all Employees');

  const query = Employee.find({}).select('name email -_id');
  query.exec(function (err, someValue) {
    if (err) return next(err);
    res.send(someValue);
  });
};

exports.request = async (req, res, next) => {
  const email = req.params.email;
  console.log('Requesting employee');
  console.log('Email:                  ', email);

  const query = Employee.findOne({ email: email });
  query.exec(function (err, someValue) {
    if (err) return next(err);
    res.send(someValue);
  });
};

exports.delete = async (req, res, next) => {
  const email = req.params.email;
  console.log('Deleting employee');
  console.log('Email:                  ', email);

  const query = Employee.findOneAndDelete({ email: email });
  query.exec(function (err, someValue) {
    if (err) return next(err);
    res.send(someValue);
  });
};

exports.add = async (req, res, next) => {
  const uniqueString = require('unique-string');
  const email = `a.b@${uniqueString()}.com`;
  console.log('Adding employee(s)');
  console.log('Email:                  ', email);

  const employee = new Employee({ name: 'new employee', email: email, 'job title': 'no job title' });
  await employee.save();
  console.log(employee);

  const query = Employee.findOne({ email: email });
  query.exec(function (err, someValue) {
    if (err) return next(err);
    res.status(201).json(someValue);
  });
};

exports.update = async (req, res, next) => {
  const sanitise = require('mongo-sanitize');
  const currentEmail = req.params.email;

  const newEmail = sanitise(req.body['employee-email']);
  const name = req.body['employee-name'];
  const title = req.body['employee-title'];
  console.log('Saving Employee Details');
  console.log('Old email:              ', currentEmail);
  console.log('New email:              ', newEmail);
  console.log('Name     :              ', name);
  console.log('Job Title:              ', title);

  let requestedEmployee;
  await Employee.findOne({ email: currentEmail })
    .then(result => {
      requestedEmployee = result;
    })
    .catch(handleErrors);

  requestedEmployee.name = name;
  requestedEmployee.email = newEmail;
  requestedEmployee['job title'] = title;
  requestedEmployee.save();

  const query = Employee.findOne({ email: newEmail });
  query.exec(function (err, someValue) {
    if (err) return next(err);
    res.send(someValue);
  });
};

exports.latestAssessment = async (req, res, next) => {
  const email = req.params.email;
  console.log('Getting latest assessment for employee');
  console.log('Email:                  ', email);

  let requestedEmployee;
  await Employee.findOne({ email: email })
    .then(result => {
      requestedEmployee = result;
    })
    .catch(handleErrors);

  if (requestedEmployee.assessments.length > 0) {
    console.log('Employee has been assessed, getting latest results');
    const result = await Employee.aggregate()
      .match({ email: email })
      .unwind('assessments')
      .sort({ 'assessments.assessment timestamp': -1 });
    res.send(result[0]);
  } else {
    res.status(404).send({
      message: 'employee has not been assessed'
    });
  }
};

async function handleErrors (error) {
  console.log(error);
}
