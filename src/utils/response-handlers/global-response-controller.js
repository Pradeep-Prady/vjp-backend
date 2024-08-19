const sendResponse = (data, res) => {
  res.status(data.statusCode).json({
    statusCode: data.statusCode,
    status: data.status,
    message: data.message,
    data: data.data,
  });
};

const sendErr = (err, res) => {
  var statusCode = err.statusCode == undefined ? 500 : err.statusCode;
  res.status(statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const globalResponseController = (data, req, res, next) => {
  if (data.statusCode === 200 || data.statusCode === 201) {
    sendResponse(data, res);
  } else {
    sendErr(data, res);
  }
};

export default globalResponseController;
