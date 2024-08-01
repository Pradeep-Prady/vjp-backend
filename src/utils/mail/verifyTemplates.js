const verifyedSuccess = (BASE_URL, fName, lName) => {
  return `
	<!DOCTYPE html>
  <html lang="en">
	<head>
	  <meta charset="UTF-8" />
	  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
	  <title>VJP Enterprises</title>
	  <link rel="preconnect" href="https://fonts.googleapis.com" />
	  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	  <link
		href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
		rel="stylesheet"
	  />
	  <style>
		body {
		  background-color: #f6f6f6;
		  font-family: "Poppins", sans-serif;
		  margin: 0;
		  padding: 0;
		  display: flex;
		  justify-content: center;
		  align-items: center;
		  height: 100vh;
		}
		.container {
		  width: 100%;
		  max-width: 600px;
		  background-color: #ffffff;
		  border: 1px solid #e0e0e0;
		  border-radius: 8px;
		  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		  overflow: hidden;
		  text-align: center;
		  padding: 20px;
		}
		.container img {
		  max-width: 500px;
		  margin: 20px 0;
		}
		.title {
		  font-size: 24px;
		  color: #333333;
		  margin: 20px 0;
		}
		.message {
		  font-size: 18px;
		  color: #555555;
		  margin: 20px 0;
		}
		.button-container {
		  margin: 30px 0;
		}
		.image {
			width:  auto;
			height: 200px;
		  }
		.button-container .btn {
		  padding: 12px 40px;
		  background-color: #007bff;
		  color: #ffffff;
		  border: none;
		  border-radius: 4px;
		  font-size: 16px;
		  cursor: pointer;
		  text-decoration: none;
		  display: inline-block;
		}
		.footer {
		  font-size: 14px;
		  color: #777777;
		  margin-top: 20px;
		}
	  </style>
	</head>
	<body>
	  <div class="container">
		<img
        class="image"

		  src="${BASE_URL}/src/uploads/templateImages/verified.png"
		  alt="Success"
		/>
		<h1 class="title">Email Verified Successfully!</h1>
		<p class="message">
		  Your email has been verified. You can now log in to your account.
		</p>
		<div class="button-container">
		  <a href="http://vjpenterprises.in/account/sign-in" class="btn">Go to Login</a>
		</div>
		<p class="footer">2024 &#169; All rights reserved to VJP Enterprise</p>
	  </div>
	</body>
  </html>
  
	  
	  `;
};

const verifyedFailed = () => {};

export { verifyedSuccess, verifyedFailed };
