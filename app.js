const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

require("dotenv").config();
const app = express();

// Seteamos el motor de plantillas
app.set("view engine", "ejs");

// Seteamos la carpeta public para archivos estaticos
app.use(express.static("public"));

// Configurar node para procesar datos del formulario
app.use(express.urlencoded({extended:true}));
app.use(express.json());

// Para poder trabajar con las cookies
app.use(cookieParser());

// Llamar al router
app.use("/", require("./routes/router"));

// Para eliminar el cache y que no se pueda volver con el boton de back luego de que hacemos un LOGOUT
app.use(function(req, res, next) {
    if(!req.user) {
        res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
        next();
    }
});

app.listen(process.env.PORT, () => {
    console.log("Servidor iniciado en el puerto 3000");
});
