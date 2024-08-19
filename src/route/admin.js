import { Router } from "express";
import { getAdminProfile, getDashboard, loginAdmin,logoutAdmin } from "../controller/adminController.js";
import { isAuthenticatedAdminUser } from "../utils/middlewares/authenticate.js";
const router = Router();

router.route("/dashboard").get(isAuthenticatedAdminUser ,getDashboard);
router.route("/login").post(loginAdmin);
router.route("/logout").get(isAuthenticatedAdminUser,logoutAdmin);
router.route("/me").get(isAuthenticatedAdminUser, getAdminProfile);

export default router;
