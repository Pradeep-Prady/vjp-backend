 

class AppSuccess {
  constructor(data, message, statusCode) {
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('2') ? 'success' : 'valid';
    this.message = message;
    this.data = data != undefined ? data : null;
  }
}
export default AppSuccess;
