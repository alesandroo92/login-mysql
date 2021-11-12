const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const conexon = require("../database/db"); // trabajar con la base de datos
const {promisify} = require("util"); // le indicamos que vamos a utilizar promesas
const conexion = require("../database/db");
const { response } = require("express");


// Procedimiento para registrarnos
exports.register = async(req, res) => {
    try {
        const name = req.body.name; // esto es de los input de register.ejs
        const user = req.body.user;
        const pass = req.body.pass;
        let passHash = await bcryptjs.hash(pass, 8);
        conexion.query("INSERT INTO users SET ?", {user:user, name:name, pass:passHash}, (error,res) => {
            if(error){console.log(error)};
            })
        res.redirect("/");    
    } catch (error) {
        console.log(error);
    }
};

exports.login = async (req, res) => {
    try {
        const user = req.body.user;
        const pass = req.body.pass;
        
        if(!user || !pass) {
            res.render("login", { // Configurando sweetalert
                alert: true,
                alertTitle: "Advertencia",
                alertMessaje: "Ingrese un usuario y password",
                alertIcon: "info",
                showConfirmButton: true,
                timer: false,
                ruta: "login"
            });
        } else {
            conexion.query("SELECT * FROM users WHERE user = ?", [user], async(error, results) => {
               if(results.length == 0 || ! (await bcryptjs.compare(pass, results[0].pass))) {
                res.render("login", { // Configurando sweetalert
                    alert: true,
                    alertTitle: "Error",
                    alertMessaje: "Usuario y/o Password incorrectas",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: false,
                    ruta: "login"
                });
               } else {
                   // Inicio de sesión validado
                   const id = results[0].idUsuario;
                   const token = jwt.sign({idUsuario:id}, process.env.JWT_SECRETO, {
                       expiresIn: process.env.JWT_TIEMPO_EXPIRA
                   })
                   // Generamos el token sin fecha de expiracion
                   //const token = jwt.sign({id:id}, process.env.JWT_SECRETO)
                   //console.log("TOKEN: "+token+" para el USUARIO: "+user);

                   const cookiesOption = {
                       expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 1000),
                       httpOnly: true
                   }
                   res.cookie("jwt", token, cookiesOption);
                   res.render("login", {
                    alert: true,
                    alertTitle: "Conexion exitosa",
                    alertMessaje: "¡LOGIN CORRECTO!",
                    alertIcon: "success",
                    showConfirmButton: true,
                    timer: 800,
                    ruta: ""
                   });
               }
            });
        }
    } catch (error) {
        console.log(error);
    }
};

// Metodo para corroborar si el usuario esta autenticado
exports.isAuthenticated = async(req, res, next) => {
    if(req.cookies.jwt) {
        try {
            const decodificada = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRETO);
            conexion.query("SELECT * FROM users WHERE idUsuario = ?", [decodificada.idUsuario], (error, results) => { // consulta para chequear si el usuario esta en la base de datos
                if(!results){return next()}
                req.user = results[0]
                return next()
            });
        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        res.redirect("/login"); // si no esta autenticado, lo mandamos al login
    }
}

exports.logout = (req, res) => {
    res.clearCookie("jwt");
    return res.redirect("/");
}