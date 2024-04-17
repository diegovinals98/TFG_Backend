const express = require('express');
const mysql = require('mysql');
const http2 = require('http2');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");



const app = express();

app.use(express.json()); // Para analizar application/json
  console.log('Conectando...')


  // Crear conexión a la base de datos
  const db = mysql.createConnection({
    host: '192.168.1.113', // La IP de tu máquina donde corre Docker
    user: 'root', // El usuario de la base de datos
    password: '27101998', // La contraseña de la base de datos
    database: 'Series' // El nombre de tu base de datos
  });



  // Conectar a la base de datos
  db.connect((err) => {
    if(err) {
      console.log('----- ERROR -----')
      throw err;
    }
    const now = new Date();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    console.log(`Conectado a MariaDB - ${now.toLocaleDateString('es-ES', options)}`);

});

app.use(cors({
  origin: 'https://soportefst.lapspartbox.com' // Asegúrate de cambiar esto por tu origen específico
}));

const options = {
  definition: {
    openapi: '3.0.0', // Versión de OpenAPI
    info: {
      title: 'API Family Series Track',
      version: '1.1.0',
      description: 'Proporciona funcionalidades que permiten a los usuarios registrarse, iniciar sesión, gestionar su perfil y sus preferencias de visualización, así como seguir sus series favoritas. Los usuarios pueden agregar series a su lista, marcar episodios vistos, recibir notificaciones sobre nuevos episodios, y más. Además, la API facilita la interacción social permitiendo a los usuarios crear grupos, unirse a ellos, y compartir sus intereses en series con amigos o miembros del grupo. Con un enfoque en la experiencia del usuario, la API está construida para ser intuitiva y accesible, asegurando que los entusiastas de las series puedan llevar un seguimiento detallado de sus programas favoritos y descubrir nuevos basados en sus gustos y recomendaciones del sistema.',
    },
  },
  apis: ['./backend.js'], // Apunta al archivo actual
};

const swaggerSpec = swaggerJsDoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));




/**
 * @swagger
 * /admin/health:
 *   get:
 *     summary: Verifica la salud del servicio
 *     description: Retorna "Hello World" como una prueba simple de que el servicio está operativo.
 *     tags: [Comprobación]
 *     responses:
 *       200:
 *         description: Servicio saludable
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Hello World
 *       500:
 *         description: Error interno del servidor
 */
app.get('/admin/health', (req, res) => {
  res.send('Hello World');
});


/**
 * @swagger
 * /login2:
 *   post:
 *     summary: Verifica el inicio de sesión de un usuario
 *     description: Busca un usuario por su nombre y compara la contraseña proporcionada con la almacenada en la base de datos.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario:
 *                 type: string
 *                 description: Nombre de usuario
 *               contraseña:
 *                 type: string
 *                 description: Contraseña del usuario
 *             required:
 *               - usuario
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: integer
 *                   description: Indicador de éxito (1 para éxito, 0 para falla)
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     usuario:
 *                       type: string
 *                     hashPassword:
 *                       type: string
 *                       description: Hash de la contraseña del usuario
 *       400:
 *         description: Datos de solicitud incorrectos
 *       500:
 *         description: Error interno del servidor
 */
app.post('/login2', (req, res) => {
  let usuario = req.body.usuario;
  //let contraseña = req.body.contraseña; // Asegúrate de que esto coincida con el nombre de campo en tu base de datos

  console.log("Usuario: " + usuario);
  //console.log("Contraseña: " + contraseña);
  let sql = 'SELECT * FROM Usuarios WHERE Usuario = ? ';
  db.query(sql, [usuario], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al verificar el usuario');
    }
    if (results.length > 0) {
      // Usuario encontrado y contraseña correcta
      console.log('Inicio de sesión exitoso:')
      
      // Envía los datos del usuario en la respuesta
      let user = results[0]; // asumiendo que el usuario es único
      let hashPassword = user.Contraseña; // Obtener el hash de la contraseña
      console.log(user)
      res.json({ success: 1, usuario: user, hashPassword: hashPassword});
      
    } else {
      // Usuario no encontrado o contraseña incorrecta
      console.log('Usuario o contraseña incorrectos');
      res.json({ success: 0 });
    }
  });
});


/**
 * @swagger
 * /usuario:
 *   get:
 *     summary: Obtiene una lista de todos los usuarios
 *     description: Devuelve una lista con todos los usuarios registrados en la base de datos.
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Id:
 *                     type: integer
 *                     description: El ID único del usuario
 *                   Nombre:
 *                     type: string
 *                     description: El nombre del usuario
 *                   Usuario:
 *                     type: string
 *                     description: El nombre de usuario
 *                   Contraseña:
 *                     type: string
 *                     description: La contraseña del usuario (hash)
 *                   Apellidos:
 *                     type: string
 *                     description: Los apellidos del usuario
 *       500:
 *         description: Error al obtener la lista de usuarios
 */
app.get('/usuario', (req, res) => {
  console.log("llamado a Usuario")
  let sql = 'SELECT * FROM Usuarios';
  db.query(sql, (err, results) => {
    if(err) throw err;
    console.log(results);
    res.send(results);
  });
});


/**
 * @swagger
 * /usuario/{id}:
 *   put:
 *     summary: Actualiza los detalles de un usuario
 *     description: Actualiza la información de un usuario existente en la base de datos basándose en su ID único.
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: El ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newNombre:
 *                 type: string
 *                 description: El nuevo nombre del usuario
 *               newApellidos:
 *                 type: string
 *                 description: Los nuevos apellidos del usuario
 *               newUsuario:
 *                 type: string
 *                 description: El nuevo nombre de usuario
 *               newContrasena:
 *                 type: string
 *                 description: La nueva contraseña del usuario
 *             required:
 *               - newNombre
 *               - newApellidos
 *               - newUsuario
 *               - newContrasena
 *     responses:
 *       200:
 *         description: Datos del usuario actualizados correctamente
 *       400:
 *         description: Solicitud incorrecta debido a la falta de datos necesarios
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al actualizar el usuario
 */
app.put('/usuario/:id', (req, res) => {
  const { id } = req.params;
  const { newNombre, newApellidos, newUsuario, newContrasena } = req.body;

  let sql = `UPDATE Usuarios SET Nombre = ?, Apellidos = ?, Usuario = ?, Contraseña = ? WHERE Id = ?`;
  db.query(sql, [newNombre, newApellidos, newUsuario, newContrasena, id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error al actualizar el usuario');
    } else {
      console.log('Datos del usuario actualizados:', result);
      res.send('Datos del usuario actualizados correctamente.');
    }
  });
});


/**
 * @swagger
 * /usuario:
 *   post:
 *     summary: Añade un nuevo usuario a la base de datos
 *     description: Crea un nuevo usuario con los datos proporcionados. Verifica que el nombre de usuario no esté ya en uso.
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Id:
 *                 type: integer
 *                 description: El ID único del usuario (opcional).
 *               Nombre:
 *                 type: string
 *                 description: El nombre del usuario.
 *               Usuario:
 *                 type: string
 *                 description: El nombre de usuario, que debe ser único.
 *               Contraseña:
 *                 type: string
 *                 description: La contraseña del usuario.
 *               Apellidos:
 *                 type: string
 *                 description: Los apellidos del usuario.
 *             required:
 *               - Nombre
 *               - Usuario
 *               - Contraseña
 *               - Apellidos
 *     responses:
 *       200:
 *         description: Usuario añadido con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: integer
 *                   description: Un indicador de éxito (1 para éxito, 0 para fallo)
 *                 message:
 *                   type: string
 *                   description: Mensaje descriptivo del resultado
 *       400:
 *         description: Falta información necesaria o el nombre de usuario ya está en uso
 *       500:
 *         description: Error al insertar el usuario en la base de datos
 */
app.post('/usuario', (req, res) => {
  console.log("Añadiendo un nuevo usuario");
  
  // Verificar si el nombre de usuario ya existe
  let username = req.body.Usuario;
  console.log("Usuario a añadir: " + username)
  let sqlCheckUsername = 'SELECT * FROM Usuarios WHERE Usuario = ?';
  db.query(sqlCheckUsername, username, (err, rows) => {
    if (err) throw err;
    // Si se encuentra algún usuario con el mismo nombre de usuario
    if (rows.length > 0) {
      mensaje = 'El nombre de usuario ya está en uso'
      console.log(mensaje)
      res.json({success: 0, message: mensaje});
    
    } else {
      // Si no se encuentra ningún usuario con el mismo nombre de usuario, procede a añadir el nuevo usuario
      let nuevoUsuario = {
        Id: req.body.Id,
        Nombre: req.body.Nombre,
        Usuario: req.body.Usuario,
        Contraseña: req.body.Contraseña,
        Apellidos: req.body.Apellidos
      };

      let sqlInsertUsuario = 'INSERT INTO Usuarios SET ?';
      db.query(sqlInsertUsuario, nuevoUsuario, (err, result) => {
        if (err) throw err;
        mensaje = 'Usuario añadido con exito'
        console.log(mensaje)
        res.json({success: 1, message: mensaje});
      });
    }
  });
});



/**
 * @swagger
 * /usuario_grupo:
 *   get:
 *     summary: Obtiene una lista de los grupos de usuarios
 *     description: Devuelve todos los registros de la tabla Usuario_Grupo2, que relaciona a los usuarios con sus grupos.
 *     tags: [Usuario Grupo]
 *     responses:
 *       200:
 *         description: Lista de grupos de usuarios obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID_Grupo:
 *                     type: integer
 *                     description: El ID del grupo
 *                   ID_Usuario:
 *                     type: integer
 *                     description: El ID del usuario perteneciente al grupo
 *       500:
 *         description: Error en el servidor
 */
app.get('/usuario_grupo', (req, res) => {
  console.log("llamado a Usuario_Grupo")
  let sql = 'SELECT * FROM Usuario_Grupo2';
  db.query(sql, (err, results) => {
    if(err) throw err;
    console.log(results);
    res.send(results);
  });
});


/**
 * @swagger
 * /grupos/{userId}:
 *   get:
 *     summary: Obtiene los grupos de un usuario específico
 *     description: Devuelve una lista de todos los grupos a los que pertenece un usuario, basado en su ID de usuario.
 *     tags: [Grupos]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del usuario
 *     responses:
 *       200:
 *         description: Lista de grupos obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID_Grupo:
 *                     type: integer
 *                     description: El ID del grupo
 *                   Nombre_grupo:
 *                     type: string
 *                     description: El nombre del grupo
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
app.get('/grupos/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log("Llamado a grupos para el usuario:", userId);

  // Ajusta esta consulta SQL según tu esquema de base de datos
  let sql = `SELECT Grupos.* FROM Grupos
             JOIN Usuario_Grupo2 ON Grupos.ID_Grupo = Usuario_Grupo2.ID_Grupo
             WHERE Usuario_Grupo2.ID_Usuario = ?`;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      res.status(500).send('Error en el servidor');
      return;
    }
    console.log(results);
    res.send(results);
  });
});




/**
 * @swagger
 * /series-ids-usuario/{userId}:
 *   get:
 *     summary: Obtiene los IDs de series comunes a todos los usuarios de un grupo
 *     description: Devuelve los IDs de las series que son comunes a todos los usuarios de un grupo específico. Requiere el ID de un usuario y el nombre de un grupo como parámetros.
 *     tags: [Series]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del usuario.
 *       - in: query
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: El nombre del grupo.
 *     responses:
 *       200:
 *         description: Lista de IDs de series comunes obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: integer
 *                 description: ID de una serie.
 *       404:
 *         description: Grupo no encontrado o no hay usuarios en el grupo.
 *       500:
 *         description: Error interno del servidor.
 */

app.get('/series-ids-usuario/:userId/:grupoId', (req, res) => {
  // Extraemos el userId del parámetro de ruta y el grupoId del parámetro de ruta
  const userId = req.params.userId;
  const groupId = req.params.grupoId;

  // Registrando en consola el inicio del proceso
  console.log("Llamado para obtener los IDs de series para el usuario:", userId);
  console.log("Para el grupo con ID:", groupId);

  // Consulta SQL para obtener los IDs de usuarios que pertenecen al grupo
  let sqlGetUsersInGroup = `SELECT ID_Usuario FROM Usuario_Grupo2 WHERE ID_Grupo = ?`;

  // Ejecución de la consulta para obtener los usuarios del grupo
  db.query(sqlGetUsersInGroup, [groupId], (usersErr, usersResults) => {
    if (usersErr) {
      // En caso de error al obtener usuarios, devolver un error 500
      console.error('Error en la consulta de usuarios del grupo:', usersErr);
      res.status(500).send('Error al obtener los usuarios del grupo');
      return;
    }

    // Extracción de los IDs de los usuarios del resultado de la consulta
    const userIds = usersResults.map(row => row.ID_Usuario);
    console.log(`Usuarios en el grupo ${groupId}:`, userIds);

    // Si hay usuarios en el grupo, procedemos a buscar las series en común
    if (userIds.length > 0) {
      // Creación de placeholders para la consulta SQL (un '?' por cada ID de usuario)
      let placeholders = userIds.map(() => '?').join(',');

      // Consulta SQL para obtener los IDs de series que todos los usuarios tienen en común
      let sqlGetCommonSeries = `
        SELECT ID_Serie 
        FROM Series 
        WHERE ID_Usuario IN (${placeholders}) 
        GROUP BY ID_Serie 
        HAVING COUNT(DISTINCT ID_Usuario) = ?
      `;

      // Ejecución de la consulta para obtener las series en común
      db.query(sqlGetCommonSeries, [...userIds, userIds.length], (seriesErr, seriesResults) => {
        if (seriesErr) {
          // En caso de error al obtener las series, devolver un error 500
          console.error('Error al obtener las series comunes:', seriesErr);
          res.status(500).send('Error al obtener las series comunes');
          return;
        }

        // Extracción de los IDs de series en común del resultado de la consulta
        const commonSeriesIds = seriesResults.map(row => row.ID_Serie);
        console.log(`Series comunes para los usuarios en el grupo ${groupId}:`, commonSeriesIds);
        
        // Devolvemos los IDs de las series comunes como respuesta JSON
        res.json(commonSeriesIds);
      });
    } else {
      // Si no hay usuarios en el grupo, devolvemos un error 404
      res.status(404).send('No hay usuarios en el grupo');
    }
  });
});





/**
 * @swagger
 * /agregar-serie-usuario:
 *   post:
 *     summary: Agrega una nueva serie al perfil de un usuario
 *     description: Permite agregar una nueva serie a la lista de un usuario, comprobando primero si la serie ya está asociada con dicho usuario.
 *     tags: [Series]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: El ID del usuario.
 *               idSerie:
 *                 type: integer
 *                 description: El ID de la serie a agregar.
 *             required:
 *               - userId
 *               - idSerie
 *     responses:
 *       200:
 *         description: Serie agregada exitosamente al usuario.
 *       409:
 *         description: La serie ya existe para el usuario.
 *       500:
 *         description: Error al insertar la serie en el servidor.
 */
app.post('/agregar-serie-usuario', (req, res) => {
  const userId = req.body.userId;
  const idSerie = req.body.idSerie;

  console.log(`Solicitud para agregar la serie con ID ${idSerie} al usuario ${userId}`);

  // Primero, verifica si ya existe el par userId e idSerie
  let sqlCheck = `SELECT * FROM Series WHERE ID_Usuario = ? AND ID_Serie = ?`;

  db.query(sqlCheck, [userId, idSerie], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      res.status(500).send('Error en el servidor');
      return;
    }
    if (results.length > 0) {
      // Si ya existe la serie para el usuario, no hagas la inserción
      console.log(`La serie con ID ${idSerie} ya existe para el usuario ${userId}`);
      res.status(409).send(`La serie ya existe`);
    } else {
      // Si no existe, inserta la nueva serie para el usuario
      let sqlInsert = `INSERT INTO Series (ID_Usuario, ID_Serie) VALUES (?, ?)`;

      db.query(sqlInsert, [userId, idSerie], (insertErr, insertResults) => {
        if (insertErr) {
          console.error('Error al insertar:', insertErr);
          res.status(500).send('Error al insertar en el servidor');
          return;
        }
        console.log(`Serie con ID ${idSerie} agregada al usuario ${userId}`);
        res.status(200).send(`Serie agregada exitosamente al usuario ${userId}`);
      });
    }
  });
});


/**
 * @swagger
 * /eliminar-serie-usuario:
 *   delete:
 *     summary: Elimina una serie del perfil de un usuario
 *     description: Elimina una serie específica asociada con un usuario, basándose en los IDs del usuario y de la serie. Si la serie especificada no está asociada con el usuario, devuelve un mensaje indicando que la serie no existe para ese usuario.
 *     tags: [Series]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: El ID del usuario del cual se desea eliminar la serie.
 *               idSerie:
 *                 type: integer
 *                 description: El ID de la serie que se desea eliminar del perfil del usuario.
 *             required:
 *               - userId
 *               - idSerie
 *     responses:
 *       200:
 *         description: Serie eliminada exitosamente del usuario.
 *       404:
 *         description: La serie especificada no existe para el usuario.
 *       500:
 *         description: Error al eliminar la serie en el servidor.
 */
app.delete('/eliminar-serie-usuario', (req, res) => {
  const userId = req.body.userId;
  const idSerie = req.body.idSerie;

  console.log(`Solicitud para eliminar la serie con ID ${idSerie} del usuario ${userId}`);

  // Consulta SQL para eliminar la serie del usuario
  let sqlDelete = `DELETE FROM Series WHERE ID_Usuario = ? AND ID_Serie = ?`;

  try{
    db.query(sqlDelete, [userId, idSerie], (err, result) => {
    if (err) {
      console.error('Error al eliminar la serie:', err);
      res.status(500).send('Error al eliminar en el servidor');
      return;
    }
    if (result.affectedRows > 0) {
      // Si se ha eliminado alguna fila, significa que la eliminación fue exitosa
      console.log(`Serie con ID ${idSerie} eliminada del usuario ${userId}`);
      res.json({ message: `Serie eliminada exitosamente del usuario ${userId}` });
      // Elimina esta línea ↓
      // navia
    } else {
      // Si no se eliminó ninguna fila, significa que la serie no estaba asociada con el usuario
      console.log(`La serie con ID ${idSerie} no existe para el usuario ${userId}`);
      res.status(404).send(`La serie no existe para el usuario`);
    }
    
  });
  }catch (error) {
    res.status(500).send('Error al consultar la base de datos');
  }
  
});


/**
 * @swagger
 * paths:
  /agregar-visualizacion:
    post:
      summary: Agrega una visualización de un capítulo por un usuario.
      description: >
        Registra la visualización de un capítulo por parte de un usuario. Si el capítulo no existe en la base de datos, primero lo inserta.
        Asume que el usuario ya existe. Retorna error si no puede verificar la existencia del capítulo o si falla al insertar un nuevo capítulo.
      operationId: agregarVisualizacion
      tags:
        - Visualizaciones
      requestBody:
        description: Datos necesarios para agregar una visualización.
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - idSerie
                - capituloId
                - Name
                - Episode_number
                - season_number
                - userid
              properties:
                idSerie:
                  type: string
                  description: Identificador único de la serie.
                capituloId:
                  type: string
                  description: Identificador único del capítulo.
                Name:
                  type: string
                  description: Nombre del capítulo.
                Episode_number:
                  type: integer
                  description: Número del capítulo dentro de la temporada.
                season_number:
                  type: integer
                  description: Número de la temporada.
                userid:
                  type: string
                  description: Identificador único del usuario que visualiza el capítulo.
      responses:
        '200':
          description: Visualización agregada con éxito.
        '500':
          description: Error al verificar la existencia del capítulo o al insertar un nuevo capítulo.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Descripción del error.
*/
app.post('/agregar-visualizacion', (req, res) => {
  const { idSerie, capituloId, Name, Episode_number, season_number, userid } = req.body;

  // Verificar si el capítulo ya existe
  const capituloExisteSql = "SELECT * FROM Capitulo WHERE ID_Capitulo = ?";
  db.query(capituloExisteSql, [capituloId], (err, results) => {
    if (err) {
      console.error('Error al verificar el capítulo:', err);
      res.status(500).send('Error al verificar el capítulo');
      return;
    }
    // Si el capítulo no existe, insertarlo
    if (results.length === 0) {
      const insertarCapituloSql = "INSERT INTO Capitulo (ID_Capitulo, ID_Serie, Numero_Temporada, Nombre_Capitulo, Numero_Capitulo) VALUES (?, ?, ?, ?, ?)";
      db.query(insertarCapituloSql, [capituloId, idSerie, season_number, Name, Episode_number], (insertErr, insertResults) => {
        if (insertErr) {
          console.error('Error al insertar el capítulo:', insertErr);
          res.status(500).send('Error al insertar el capítulo');
          return;
        }
        // Si se inserta el capítulo, entonces agregar la visualización
        agregarVisualizacion(userid, capituloId, res);
      });
    } else {
      // Si el capítulo ya existe, entonces agregar la visualización
      agregarVisualizacion(userid, capituloId, res);
    }
  });
});


function agregarVisualizacion(userId, capituloId, res) {
  const fechaActual = new Date().toISOString().slice(0, 10);
  const insertarVisualizacionSql = "INSERT INTO Visualizaciones (ID_Usuario, ID_Capitulo, Fecha_Visualizacion) VALUES (?, ?, ?)";
  db.query(insertarVisualizacionSql, [userId, capituloId, fechaActual], (err, results) => {
    if (err) {
      console.error('Error al insertar la visualización:', err);
      res.status(500).send('Error al insertar la visualización');
    } else {
      res.send({ message: 'Visualizacion agregada con exito' });
      console.log('Visualizacion agregada con exito')
    }
  });
}


/*
paths:
  /eliminar-visualizacion:
    post:
      summary: Elimina una visualización específica de un usuario y un capítulo.
      description: Este endpoint permite eliminar una visualización registrada por un usuario para un capítulo específico, siempre que exista. Si la visualización no existe, retorna un mensaje indicando que no se encontró.
      operationId: eliminarVisualizacion
      tags:
        - Visualizaciones
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - capituloId
                - userid
              properties:
                capituloId:
                  type: string
                  description: El ID del capítulo del que se desea eliminar la visualización.
                  example: "12345"
                userid:
                  type: string
                  description: El ID del usuario que desea eliminar su visualización.
                  example: "67890"
      responses:
        '200':
          description: Retorna un mensaje indicando el resultado de la operación.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Visualización eliminada exitosamente"
        '400':
          description: Error por datos no válidos o problema al ejecutar la operación.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al verificar la visualización"
        '404':
          description: No se encontró la visualización solicitada.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Visualización no encontrada"

                    */
app.post('/eliminar-visualizacion', (req, res) => {
  const { capituloId, userid } = req.body;

  // Verificar si la visualización existe
  const visualizacionExisteSql = "SELECT * FROM Visualizaciones WHERE ID_Capitulo = ? AND ID_Usuario = ?";
  db.query(visualizacionExisteSql, [capituloId, userid], (err, results) => {
    if (err) {
      console.error('Error al verificar la visualización:', err);
      res.send({ message: 'Error al verificar la visualización' });
      return;
    }
    // Si la visualización existe, eliminarla
    if (results.length > 0) {
      const eliminarVisualizacionSql = "DELETE FROM Visualizaciones WHERE ID_Capitulo = ? AND ID_Usuario = ?";
      db.query(eliminarVisualizacionSql, [capituloId, userid], (deleteErr, deleteResults) => {
        if (deleteErr) {
          console.error('Error al eliminar la visualización:', deleteErr);
          res.send({ message: 'Error al eliminar la visualización' });
          return;
        }
        console.log('Eliminado existosamente')
        res.send({ message: 'Visualización eliminada exitosamente' });
      });
    } else {
      // Si la visualización no existe, enviar mensaje
      res.send({ message: 'Visualización no encontrada' });
    }
  });
});



/*
paths:
  /temporada-vista/{userId}/{idSerie}/{season_number}:
    get:
      summary: Obtiene los IDs de los capítulos vistos de una temporada específica por un usuario.
      description: Este endpoint devuelve una lista de IDs de capítulos que un usuario ha visto de una temporada específica de una serie, lo cual es útil para verificar qué capítulos ha completado el usuario.
      operationId: getCapitulosVistosTemporada
      tags:
        - Visualizaciones
      parameters:
        - in: path
          name: userId
          required: true
          schema:
            type: string
          description: El ID del usuario.
        - in: path
          name: idSerie
          required: true
          schema:
            type: string
          description: El ID de la serie.
        - in: path
          name: season_number
          required: true
          schema:
            type: integer
          description: El número de la temporada de la serie.
      responses:
        '200':
          description: Retorna una lista de IDs de capítulos vistos.
          content:
            application/json:
              schema:
                type: object
                properties:
                  vistos:
                    type: array
                    items:
                      type: string
                    description: Lista de IDs de capítulos que el usuario ha visto.
                    example: ["cap001", "cap002", "cap003"]
        '500':
          description: Error interno del servidor por problemas al consultar la base de datos.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al consultar la base de datos"

                    */
app.get('/temporada-vista/:userId/:idSerie/:season_number', async (req, res) => {
  const { userId, idSerie, season_number } = req.params;

  //res.json({ message: 'Entrando en el endpoint temporada-vista' });
  try {
    const sql = `
    SELECT C.ID_Capitulo
    FROM Capitulo C
    INNER JOIN Visualizaciones V ON C.ID_Capitulo = V.ID_Capitulo AND V.ID_Usuario = ?
    WHERE C.ID_Serie = ? AND C.Numero_Temporada = ?
    `;
    const capitulosVistos = await new Promise((resolve, reject) => {
      db.query(sql, [userId, idSerie, season_number], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    // Devuelve una lista de los ID de los capítulos que han sido vistos.
    const capitulosVistosIds = capitulosVistos.map(row => row.ID_Capitulo);
    res.json({ vistos: capitulosVistosIds });
  } catch (error) {
    res.status(500).send('Error al consultar la base de datos');
  }
});






/*
paths:
  /serie/{idSerie}/usuarios:
    get:
      summary: Lista de usuarios que han visto capítulos de una serie específica.
      description: Este endpoint devuelve información de los usuarios que han visto capítulos de la serie especificada, incluyendo la última fecha de visualización y detalles del último capítulo visto.
      operationId: getUsuariosPorSerie
      tags:
        - Usuarios
        - Series
      parameters:
        - in: path
          name: idSerie
          required: true
          schema:
            type: string
          description: El ID de la serie para la que se desean obtener los usuarios que la han visto.
      responses:
        '200':
          description: Una lista de usuarios junto con información detallada sobre su última visualización.
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    Id:
                      type: string
                      description: El ID del usuario.
                    Nombre:
                      type: string
                      description: El nombre del usuario.
                    Apellidos:
                      type: string
                      description: Los apellidos del usuario.
                    Usuario:
                      type: string
                      description: El nombre de usuario.
                    Ultima_Visualizacion:
                      type: string
                      format: date-time
                      description: Fecha de la última visualización por el usuario.
                    Nombre_Capitulo:
                      type: string
                      description: El nombre del último capítulo visto por el usuario.
                    Numero_Capitulo:
                      type: integer
                      description: El número del último capítulo visto.
                  example:
                    - Id: "123"
                      Nombre: "Juan"
                      Apellidos: "Pérez"
                      Usuario: "juanp"
                      Ultima_Visualizacion: "2023-09-15T14:48:00"
                      Nombre_Capitulo: "Inicio del viaje"
                      Numero_Capitulo: 1
        '500':
          description: Error interno del servidor debido a problemas con la base de datos.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error en la base de datos"

                    */
app.get('/serie/:idSerie/usuarios', (req, res) => {
  const { idSerie } = req.params;

  let sql = `
    SELECT 
        U.Id,
        U.Nombre,
        U.Apellidos,
        U.Usuario,
        MAX(V.Fecha_Visualizacion) AS Ultima_Visualizacion,
        C.Nombre_Capitulo,
        C.Numero_Capitulo
    FROM 
        Usuarios U
    JOIN 
        Usuario_Grupo2 UG ON U.id = UG.ID_Usuario
    JOIN 
        Visualizaciones V ON U.id = V.ID_Usuario
    JOIN 
        Capitulo C ON V.ID_Capitulo = C.ID_Capitulo AND C.ID_Serie = ?
    WHERE 
        EXISTS (
            SELECT 1
            FROM 
                Series S
            WHERE 
                S.ID_Serie = C.ID_Serie AND 
                S.ID_Serie = ? 
        )
    GROUP BY 
        U.id, C.Nombre_Capitulo, C.Numero_Capitulo
    ORDER BY 
        Ultima_Visualizacion DESC;
  `;

  db.query(sql, [idSerie, idSerie], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error en la base de datos');
    }
    
    res.json(results);
    console.log(results)
  });
});


/*
paths:
  /usuarios-viendo-serie/{nombreGrupo}/{idSerie}:
    get:
      summary: Obtiene usuarios de un grupo que están viendo una serie específica.
      description: Retorna una lista de usuarios de un grupo determinado que están viendo una serie, incluyendo los detalles del capítulo más reciente y la temporada más alta que han visto.
      operationId: getUsuariosViendoSerie
      tags:
        - Usuarios
        - Series
      parameters:
        - in: path
          name: nombreGrupo
          required: true
          schema:
            type: string
          description: El nombre del grupo cuyos miembros se desea consultar.
        - in: path
          name: idSerie
          required: true
          schema:
            type: string
          description: El ID de la serie que los usuarios están viendo.
      responses:
        '200':
          description: Lista de usuarios con la temporada más alta y el capítulo más reciente vistos.
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                      description: El ID del usuario.
                    Nombre:
                      type: string
                      description: El nombre del usuario.
                    Temporada_Mas_Alta:
                      type: integer
                      description: La temporada más alta que el usuario ha visto.
                    Capitulo_Mas_Reciente:
                      type: integer
                      description: El capítulo más reciente que el usuario ha visto.
                example:
                  - id: "001"
                    Nombre: "Ana López"
                    Temporada_Mas_Alta: 3
                    Capitulo_Mas_Reciente: 12
        '500':
          description: Error interno del servidor debido a problemas con la base de datos.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error interno del servidor"

                    */
app.get('/usuarios-viendo-serie/:nombreGrupo/:idSerie', (req, res) => {
  const { nombreGrupo, idSerie } = req.params;

  const sql = `
    SELECT 
      U.id,
      U.Nombre,
      MAX(C.Numero_Temporada) AS Temporada_Mas_Alta,
      MAX(C.Numero_Capitulo) AS Capitulo_Mas_Reciente
    FROM Usuarios U
    INNER JOIN Usuario_Grupo2 UG ON U.id = UG.ID_Usuario
    INNER JOIN Visualizaciones V ON U.id = V.ID_Usuario
    INNER JOIN Capitulo C ON V.ID_Capitulo = C.ID_Capitulo
    WHERE UG.ID_Grupo = (SELECT ID_Grupo FROM Grupos WHERE Nombre_grupo = ?)
      AND C.ID_Serie = ?
    GROUP BY U.id
    ORDER BY Temporada_Mas_Alta DESC, Capitulo_Mas_Reciente DESC;
  `;

  db.query(sql, [nombreGrupo, idSerie], (err, results) => {
    if (err) {
      console.error('Error al realizar la consulta:', err);
      res.status(500).send('Error interno del servidor');
    } else {
      console.log(results);
      res.json(results);
    }
  });
});


/*
paths:
  /crear-grupo-y-asociar-usuarios:
    post:
      summary: Crea un grupo y asocia usuarios a este.
      description: Este endpoint crea un nuevo grupo con un nombre específico y asocia una lista de usuarios al grupo creado. Si el grupo ya existe, no se crea un nuevo grupo pero se puede optar por asociar usuarios al grupo existente.
      operationId: crearGrupoYAsociarUsuarios
      tags:
        - Grupos
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - nombreGrupo
                - nombresUsuarios
              properties:
                nombreGrupo:
                  type: string
                  description: El nombre del grupo a crear.
                  example: "Grupo de Estudio"
                nombresUsuarios:
                  type: array
                  items:
                    type: string
                  description: Lista de nombres de usuarios que se asociarán al grupo.
                  example: ["usuario1", "usuario2"]
      responses:
        '200':
          description: Retorna un mensaje indicando el resultado de la operación, ya sea la creación del grupo y su asociación, o la existencia previa del mismo.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Grupo creado y usuarios asociados exitosamente."
        '400':
          description: Error por datos inválidos o incompletos proporcionados en la solicitud.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Datos inválidos. Asegúrate de enviar tanto el nombre del grupo como los nombres de los usuarios."
        '500':
          description: Error interno del servidor, por ejemplo, fallas en la base de datos.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al verificar el grupo"

                    */
const insertarGrupoConIdUnico = (nombreGrupo, admin, res, callback) => {
  let idGrupo = Math.floor(Math.random() * 1000000);

  const verificarYCrearGrupo = () => {
    // Verificar si el ID_Grupo ya existe
    db.query('SELECT * FROM Grupos WHERE ID_Grupo = ?', [idGrupo], (err, results) => {
      if (err) {
        console.error('Error al verificar el ID del grupo:', err);
        return res.status(500).send('Error al verificar el ID del grupo');
      }

      if (results.length > 0) {
        // El ID del grupo ya existe, genera uno nuevo y reintenta
        idGrupo = Math.floor(Math.random() * 1000000);
        verificarYCrearGrupo();
      } else {
        // El ID del grupo no existe, crea el grupo
        db.query('INSERT INTO Grupos (ID_Grupo, Nombre_grupo, Admin) VALUES (?, ?, ?)', [idGrupo, nombreGrupo, admin], (crearErr, crearResult) => {
          if (crearErr) {
            console.error('Error al crear el grupo:', crearErr);
            return res.status(500).send('Error al crear el grupo');
          }
          console.log('Grupo creado con ID:', idGrupo);
          if (callback) callback(idGrupo); // Continúa con la asociación de usuarios
        });
      }
    });
  };

  verificarYCrearGrupo();
};

// Ajusta la llamada inicial para incluir admin
app.post('/crear-grupo-y-asociar-usuarios', (req, res) => {
  const { nombreGrupo, nombresUsuarios, admin } = req.body;
  insertarGrupoConIdUnico(nombreGrupo, admin, res, (idGrupoNuevo) => {
    asociarUsuariosAGrupo(nombresUsuarios, idGrupoNuevo, res);
  });
});

function asociarUsuariosAGrupo(nombresUsuarios, idGrupo, res) {
  // Mapear cada nombre de usuario a una promesa que realiza la verificación y posible asociación
  const asociacionesPromesas = nombresUsuarios.map(nombreUsuario => {
    return new Promise(async (resolve, reject) => {
      try {
        const usuarioResults = await new Promise((resolve, reject) => {
          db.query('SELECT * FROM Usuarios WHERE Usuario = ?', [nombreUsuario], (err, results) => {
            if (err) reject(err);
            resolve(results);
          });
        });

        if (usuarioResults.length > 0) {
          const idUsuario = usuarioResults[0].Id;

          // Verificar si el usuario ya está asociado con el grupo
          const asociaciones = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM Usuario_Grupo2 WHERE ID_Usuario = ? AND ID_Grupo = ?', [idUsuario, idGrupo], (err, results) => {
              if (err) reject(err);
              resolve(results);
            });
          });

          if (asociaciones.length === 0) {
            // Asociar el usuario al grupo
            await new Promise((resolve, reject) => {
              db.query('INSERT INTO Usuario_Grupo2 (ID_Usuario, ID_Grupo) VALUES (?, ?)', [idUsuario, idGrupo], (err, results) => {
                if (err) reject(err);
                resolve();
              });
            });
            console.log(`Usuario ${nombreUsuario} (ID: ${idUsuario}) asociado al grupo ID: ${idGrupo}.`);
            resolve(`Usuario ${nombreUsuario} asociado al grupo ID: ${idGrupo}.`);
          } else {
            resolve(`Usuario ${nombreUsuario} ya estaba asociado al grupo ID: ${idGrupo}.`);
          }
        } else {
          console.log(`Usuario ${nombreUsuario} no existe.`);
          resolve(`Usuario ${nombreUsuario} no existe.`);
        }
      } catch (error) {
        reject(`Error al asociar el usuario ${nombreUsuario} al grupo ID: ${idGrupo}: ${error}`);
      }
    });
  });

  // Esperar a que todas las promesas se resuelvan
  Promise.all(asociacionesPromesas).then(resultados => {
    console.log("Todos los usuarios han sido procesados:", resultados);
    res.send({ message: 'Todos los usuarios han sido procesados con éxito.', detalles: resultados });
  }).catch(error => {
    console.error("Error procesando los usuarios:", error);
    res.status(500).send('Error al asociar usuarios al grupo.');
  });
}


/*
paths:
  /miembros-grupo/{nombreGrupo}:
    get:
      summary: Obtiene los miembros de un grupo específico.
      description: Este endpoint recupera la lista de usuarios que son miembros de un grupo específico, basado en el nombre del grupo proporcionado. Retorna los detalles del grupo y sus miembros.
      operationId: getMiembrosDeGrupo
      tags:
        - Grupos
      parameters:
        - in: path
          name: nombreGrupo
          required: true
          schema:
            type: string
          description: El nombre del grupo cuyos miembros se desea obtener.
      responses:
        '200':
          description: Lista de miembros del grupo solicitado.
          content:
            application/json:
              schema:
                type: object
                properties:
                  groupId:
                    type: string
                    description: El ID del grupo obtenido.
                  members:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                          description: El ID del usuario.
                        Nombre:
                          type: string
                          description: El nombre del usuario.
                        Usuario:
                          type: string
                          description: El nombre de usuario.
                        Apellidos:
                          type: string
                          description: Los apellidos del usuario.
                example:
                  groupId: "grp123"
                  members:
                    - id: "usr001"
                      Nombre: "Juan"
                      Usuario: "juan123"
                      Apellidos: "Pérez"
        '404':
          description: Grupo no encontrado.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Grupo no encontrado"
        '500':
          description: Error interno del servidor por problemas al buscar el grupo o al obtener los miembros.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al buscar el grupo en el servidor"

                    */
app.get('/miembros-grupo/:nombreGrupo', (req, res) => {
  const { nombreGrupo } = req.params;

  // Primero, obtén el ID del grupo basado en el nombre proporcionado
  const sqlGetGroupId = 'SELECT ID_Grupo FROM Grupos WHERE Nombre_grupo = ?';

  db.query(sqlGetGroupId, [nombreGrupo], (err, groupResults) => {
    if (err) {
      console.error('Error al buscar el grupo:', err);
      return res.status(500).send('Error al buscar el grupo en el servidor');
    }

    if (groupResults.length === 0) {
      return res.status(404).send('Grupo no encontrado');
    }

    const groupId = groupResults[0].ID_Grupo;

    // Luego, obtén los miembros del grupo usando el ID del grupo
    const sqlGetGroupMembers = `
      SELECT id, Usuarios.Nombre, Usuarios.Usuario, Usuarios.Apellidos
      FROM Usuarios
      JOIN Usuario_Grupo2 ON id = Usuario_Grupo2.ID_Usuario
      WHERE Usuario_Grupo2.ID_Grupo = ?
    `;

    db.query(sqlGetGroupMembers, [groupId], (err, membersResults) => {
      if (err) {
        console.error('Error al obtener los miembros del grupo:', err);
        return res.status(500).send('Error al obtener los miembros del grupo');
      }

      res.json({
        groupId: groupId,
        members: membersResults
      });
    });
  });
});


app.get('/miembros-grupo-POR-ID/:idGrupo', (req, res) => {
  const { idGrupo } = req.params;

  // Primero, obtén el ID del grupo basado en el nombre proporcionado
  const sqlGetGroupName = 'SELECT Nombre_grupo FROM Grupos WHERE ID_Grupo = ?';

  db.query(sqlGetGroupName, [idGrupo], (err, groupResults) => {
    if (err) {
      console.error('Error al buscar el grupo:', err);
      return res.status(500).send('Error al buscar el grupo en el servidor');
    }

    if (groupResults.length === 0) {
      return res.status(404).send('Grupo no encontrado');
    }

    const groupName = groupResults[0].Nombre_grupo;

    // Luego, obtén los miembros del grupo usando el ID del grupo
    const sqlGetGroupMembers = `
      SELECT id, Usuarios.Nombre, Usuarios.Usuario, Usuarios.Apellidos
      FROM Usuarios
      JOIN Usuario_Grupo2 ON id = Usuario_Grupo2.ID_Usuario
      WHERE Usuario_Grupo2.ID_Grupo = ?
    `;

    db.query(sqlGetGroupMembers, [idGrupo], (err, membersResults) => {
      if (err) {
        console.error('Error al obtener los miembros del grupo:', err);
        return res.status(500).send('Error al obtener los miembros del grupo');
      }

      res.json({
        nombreGrupo: groupName,
        members: membersResults
      });
    });
  });
});





app.get('/id-admin/:idGrupo', (req, res) => {

  const { idGrupo } = req.params;

  console.log('Id del grupo que busca Admin: ' + idGrupo)
    // Luego, obtén los miembros del grupo usando el ID del grupo
    const sqlGetAdmin = `
      SELECT Admin
      FROM Grupos
      WHERE ID_Grupo = ?
    `;

    db.query(sqlGetAdmin, [idGrupo], (err, adminResult) => {
      if (err) {
        console.error('Error al obtener el admin del grupo:', err);
        return res.status(500).send('Error al obtener el admin del grupo');
      }

      res.json({
        admin: adminResult
      });
    });

});

/*
paths:
  /usuario_por_id/{idUsuario}:
    get:
      summary: Obtiene el ID de un usuario basado en su nombre de usuario.
      description: Este endpoint recupera el ID de un usuario dado su nombre de usuario. Útil para operaciones donde solo se conoce el nombre de usuario y se necesita el ID para operaciones adicionales.
      operationId: getUsuarioPorId
      tags:
        - Usuarios
      parameters:
        - in: path
          name: idUsuario
          required: true
          schema:
            type: string
          description: El nombre de usuario para el cual se desea obtener el ID.
      responses:
        '200':
          description: Retorna el ID del usuario solicitado.
          content:
            application/json:
              schema:
                type: object
                properties:
                  idUsuario:
                    type: string
                    description: El ID del usuario correspondiente al nombre de usuario proporcionado.
                example:
                  idUsuario: "12345"
        '404':
          description: Usuario no encontrado si no hay coincidencias con el nombre de usuario proporcionado.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Usuario no encontrado"
        '500':
          description: Error interno del servidor si se produce un problema al intentar recuperar el ID del usuario.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al obtener el ID del usuario"

                    */
app.get('/usuario_por_id/:idUsuario', (req, res) => {
  console.log(req.params)
  usuario  = req.params.idUsuario;
  console.log('Usuario a añadir: ' , usuario)

  
  db.query('SELECT Id FROM Usuarios WHERE Usuario = ?', [usuario], (err, resultados) => {
    if (err) {
      console.error('Error al obtener el ID del usuario:', err);
      return res.status(500).send('Error al obtener el ID del usuario');
    }

    // Verifica si se encontraron resultados
    if (resultados.length > 0) {
      // Como esperamos un único resultado, tomamos el primer elemento
      const idUsuario = resultados[0].Id;

      res.json({
        idUsuario: idUsuario,
      });
    } else {
      // Maneja el caso en que no se encuentran resultados
      res.status(404).send('Usuario no encontrado');
    }
  });
});


/*
paths:
  /grupo_por_nombre/{nombreGrupo}:
    get:
      summary: Obtiene el ID de un grupo basado en su nombre.
      description: Este endpoint recupera el ID de un grupo dado su nombre. Es útil para operaciones que requieren el ID del grupo para otras consultas o acciones.
      operationId: getGrupoPorNombre
      tags:
        - Grupos
      parameters:
        - in: path
          name: nombreGrupo
          required: true
          schema:
            type: string
          description: El nombre del grupo para el cual se desea obtener el ID.
      responses:
        '200':
          description: Retorna el ID del grupo solicitado.
          content:
            application/json:
              schema:
                type: object
                properties:
                  idGrupo:
                    type: string
                    description: El ID del grupo correspondiente al nombre proporcionado.
                example:
                  idGrupo: "grp001"
        '404':
          description: Grupo no encontrado si no hay coincidencias con el nombre del grupo proporcionado.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Grupo no encontrado"
        '500':
          description: Error interno del servidor si se produce un problema al intentar recuperar el ID del grupo.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al obtener el ID del grupo"

                    */
app.get('/grupo_por_nombre/:nombreGrupo', (req, res) => {
  console.log(req.params);
  const nombreGrupo = req.params.nombreGrupo;
  console.log('Grupo a buscar: ', nombreGrupo);

  db.query('SELECT ID_Grupo FROM Grupos WHERE Nombre_grupo = ?', [nombreGrupo], (err, resultados) => {
    if (err) {
      console.error('Error al obtener el ID del grupo:', err);
      return res.status(500).send('Error al obtener el ID del grupo');
    }

    // Verifica si se encontraron resultados
    if (resultados.length > 0) {
      // Como esperamos un único resultado, tomamos el primer elemento
      const idGrupo = resultados[0].ID_Grupo;

      res.json({
        idGrupo: idGrupo,
      });
    } else {
      // Maneja el caso en que no se encuentran resultados
      res.status(404).send('Grupo no encontrado');
    }
  });
});


/*
paths:
  /comentarios_por_grupo_serie/{grupo_id}/{serie_id}:
    get:
      summary: Obtiene los comentarios de una serie específica por grupo.
      description: Este endpoint devuelve todos los comentarios realizados sobre una serie específica dentro de un grupo. Los comentarios son devueltos en orden cronológico ascendente.
      operationId: getComentariosPorGrupoYSerie
      tags:
        - Comentarios
      parameters:
        - in: path
          name: grupo_id
          required: true
          schema:
            type: string
          description: El ID del grupo del cual se quieren obtener los comentarios.
        - in: path
          name: serie_id
          required: true
          schema:
            type: string
          description: El ID de la serie de la cual se quieren obtener los comentarios.
      responses:
        '200':
          description: Lista de comentarios de la serie dentro del grupo especificado.
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    nombreCompleto:
                      type: string
                      description: El nombre completo del usuario que hizo el comentario.
                    comentario:
                      type: string
                      description: El texto del comentario.
                    fechaHora:
                      type: string
                      format: date-time
                      description: La fecha y hora cuando se realizó el comentario.
                example:
                  - nombreCompleto: "Juan Pérez"
                    comentario: "Me encantó el último episodio!"
                    fechaHora: "2023-03-15T08:30:00Z"
        '400':
          description: Falta proporcionar uno o más de los parámetros necesarios.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Faltan parámetros necesarios: grupo_id y serie_id"
        '500':
          description: Error interno del servidor debido a problemas al recuperar los comentarios.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al obtener los comentarios"

                    */
app.get('/comentarios_por_grupo_serie/:grupo_id/:serie_id', (req, res) => {
  const grupoId = req.params.grupo_id;
  const serieId = req.params.serie_id;

  if (!grupoId || !serieId) {
    return res.status(400).send('Faltan parámetros necesarios: grupo_id y serie_id');
  }

  const consultaSQL = `
    SELECT 
      Usuarios.Nombre, 
      Usuarios.Apellidos, 
      ComentariosSerie.comentario, 
      ComentariosSerie.fecha_hora
    FROM 
      ComentariosSerie
    JOIN 
      Usuarios ON ComentariosSerie.usuario_id = Usuarios.Id
    WHERE 
      ComentariosSerie.grupo_id = ? AND ComentariosSerie.serie_id = ?
    ORDER BY 
      ComentariosSerie.fecha_hora ASC
  `;

  db.query(consultaSQL, [grupoId, serieId], (error, resultados) => {
    if (error) {
      console.error('Error al obtener los comentarios:', error);
      return res.status(500).send('Error al obtener los comentarios');
    }

    // Convierte los resultados en un formato más amigable si es necesario
    const comentarios = resultados.map(comentario => ({
      nombreCompleto: `${comentario.Nombre} ${comentario.Apellidos}`,
      comentario: comentario.comentario,
      fechaHora: comentario.fecha_hora,
    }));

    console.log('COMENTARIOS' , comentarios)

    res.json(comentarios);
  });
});


/*
paths:
  /anadir_usuario_a_grupo:
    post:
      summary: Añade un usuario a un grupo específico.
      description: Este endpoint añade un usuario a un grupo después de verificar que el usuario no pertenezca ya al grupo. Si el usuario ya está en el grupo, retorna un mensaje indicando tal situación.
      operationId: anadirUsuarioAGrupo
      tags:
        - Grupos
        - Usuarios
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - idUsuario
                - idGrupo
              properties:
                idUsuario:
                  type: string
                  description: El ID del usuario a añadir al grupo.
                  example: "usr123"
                idGrupo:
                  type: string
                  description: El ID del grupo al que se va a añadir el usuario.
                  example: "grp456"
      responses:
        '200':
          description: Respuesta sobre el resultado de la operación.
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: integer
                    description: "Un código que representa el resultado de la operación: 0 para error, 1 para éxito, 2 para usuario ya en grupo."
                    example: 1
                  mensaje:
                    type: string
                    description: "Descripción del resultado de la operación."
                    example: "Añadido con éxito"
        '500':
          description: Error interno del servidor, como un problema al acceder a la base de datos.
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: integer
                    description: "Un código que representa el resultado de la operación: 0 para error."
                    example: 0
                  mensaje:
                    type: string
                    description: "Mensaje de error describiendo el problema."
                    example: "Error del servidor al verificar la existencia"
*/
app.post('/anadir_usuario_a_grupo', (req, res) => {
  const idUsuario = req.body.idUsuario; // Acceso correcto al cuerpo de la solicitud
  const idGrupo = req.body.idGrupo; // Acceso correcto al cuerpo de la solicitud
  console.log("Id usuario: ", idUsuario);
  console.log("Id grupo: ", idGrupo);

  // Primero, verificar si la combinación ya existe en la base de datos
  db.query('SELECT * FROM Usuario_Grupo2 WHERE ID_Usuario = ? AND ID_Grupo = ?', [idUsuario, idGrupo], (error, results) => {
    if (error) {
      // Manejar errores de base de datos aquí
      console.log("Error BBDD");
      res.json({ success: 0, mensaje: 'Error del servidor al verificar la existencia' });
    } else if (results.length > 0) {
      // Si ya existe, enviar una respuesta indicando que ya se encuentra en el grupo
      console.log("El usuario ya está añadido al grupo");
      res.json({ success: 2, mensaje: 'El usuario ya existe en el grupo' });
    } else {
      // Si no existe, proceder con la inserción
      db.query('INSERT INTO Usuario_Grupo2 (ID_Usuario, ID_Grupo) VALUES (?, ?)', [idUsuario, idGrupo], (errorInsert, resultsInsert) => {
        if (errorInsert) {
          // Manejar errores de base de datos aquí
          console.log("Error BBDD");
          res.json({ success: 0, mensaje: 'Error del servidor al insertar'});
        } else {
          let mensaje = 'Añadido con éxito';
          console.log(mensaje);
          res.json({ success: 1, mensaje: mensaje });
        }
      });
    }
  });
});


/*
paths:
  /anadir_comentario_a_serie:
    post:
      summary: Añade un comentario a una serie dentro de un grupo específico.
      description: Este endpoint permite a los usuarios añadir comentarios a una serie específica dentro de un grupo. Los datos necesarios incluyen el ID del usuario, el grupo y la serie, junto con el comentario en sí.
      operationId: anadirComentarioASerie
      tags:
        - Comentarios
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - idUsuario
                - idGrupo
                - idSerie
                - comentario
              properties:
                idUsuario:
                  type: string
                  description: El ID del usuario que añade el comentario.
                  example: "usr123"
                idGrupo:
                  type: string
                  description: El ID del grupo dentro del cual se añade el comentario.
                  example: "grp456"
                idSerie:
                  type: string
                  description: El ID de la serie a la que se añade el comentario.
                  example: "ser789"
                comentario:
                  type: string
                  description: El texto del comentario que se está añadiendo.
                  example: "Este episodio fue increíble, especialmente la escena final."
      responses:
        '200':
          description: Comentario añadido exitosamente, devuelve el ID del comentario insertado.
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: integer
                    description: "Un código que representa el resultado de la operación: 0 para error, 1 para éxito."
                    example: 1
                  mensaje:
                    type: string
                    description: "Descripción del resultado de la operación."
                    example: "Comentario añadido con éxito"
                  idComentario:
                    type: integer
                    description: "El ID del comentario insertado en la base de datos."
                    example: 101
        '500':
          description: Error interno del servidor, como un problema al acceder a la base de datos.
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: integer
                    description: "Un código que representa el resultado de la operación: 0 para error."
                    example: 0
                  mensaje:
                    type: string
                    description: "Mensaje de error describiendo el problema."
                    example: "Error del servidor al insertar el comentario"
*/
app.post('/anadir_comentario_a_serie', (req, res) => {
  // Recibir los datos necesarios del cuerpo de la solicitud
  const idUsuario = req.body.idUsuario;
  const idGrupo = req.body.idGrupo;
  const idSerie = req.body.idSerie;
  const comentario = req.body.comentario;

  console.log("Id usuario: ", idUsuario);
  console.log("Id grupo: ", idGrupo);
  console.log("Id serie: ", idSerie);
  console.log("Comentario: ", comentario);

  // Insertar el comentario en la base de datos
  db.query('INSERT INTO ComentariosSerie (comentario, usuario_id, grupo_id, serie_id) VALUES (?, ?, ?, ?)', [comentario, idUsuario, idGrupo, idSerie], (errorInsert, resultsInsert) => {
    if (errorInsert) {
      // Manejar errores de base de datos aquí
      console.log("Error BBDD: ", errorInsert);
      res.json({ success: 0, mensaje: 'Error del servidor al insertar el comentario' });
    } else {
      let mensaje = 'Comentario añadido con éxito';
      console.log(mensaje);
      res.json({ success: 1, mensaje: mensaje, idComentario: resultsInsert.insertId }); // Devuelve el ID del comentario insertado
    }
  });
});




/*
paths:
  /actualizar-nombre-grupo/{id}:
    put:
      summary: Actualiza el nombre de un grupo específico.
      description: Este endpoint permite actualizar el nombre de un grupo existente. El ID del grupo es especificado en la URL y el nuevo nombre se pasa en el cuerpo de la solicitud.
      operationId: actualizarNombreGrupo
      tags:
        - Grupos
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
          description: El ID del grupo cuyo nombre se desea actualizar.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - nuevoNombre
              properties:
                nuevoNombre:
                  type: string
                  description: El nuevo nombre que se asignará al grupo.
                  example: "Nuevo Grupo de Estudio"
      responses:
        '200':
          description: El nombre del grupo ha sido actualizado exitosamente.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Grupo con ID {id} ha sido actualizado exitosamente a 'Nuevo Grupo de Estudio'"
        '400':
          description: Falta proporcionar el nuevo nombre del grupo en la solicitud.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "El nuevo nombre es requerido"
        '404':
          description: El grupo especificado no fue encontrado o no se pudo actualizar.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Grupo no encontrado o no se pudo actualizar"
        '500':
          description: Error interno del servidor debido a un problema al actualizar el nombre del grupo.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al actualizar el nombre del grupo"
*/
app.put('/actualizar-nombre-grupo/:id', (req, res) => {
  const { id } = req.params; // Obtén el ID del grupo de los parámetros de la ruta
  const { nuevoNombre } = req.body; // Asume que el nuevo nombre viene en el cuerpo de la solicitud

  console.log('Entramos en actualizar nombre del grupo')

  if (!nuevoNombre) {
    return res.status(400).send('El nuevo nombre es requerido');
  }

  // Consulta SQL para actualizar el nombre del grupo en la base de datos
  const sqlUpdateGroupName = `
    UPDATE Grupos
    SET Nombre_grupo = ?
    WHERE ID_Grupo = ?
  `;

  db.query(sqlUpdateGroupName, [nuevoNombre, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el nombre del grupo:', err);
      return res.status(500).send('Error al actualizar el nombre del grupo');
    }

    if (result.affectedRows === 0) {
      // Si no se encontró el grupo con ese ID o no se realizó la actualización
      return res.status(404).send('Grupo no encontrado o no se pudo actualizar');
    }

    console.log(`Grupo con ID ${id} actualizado a nombre "${nuevoNombre}"`);
    res.send(`Grupo con ID ${id} ha sido actualizado exitosamente a "${nuevoNombre}"`);
  });
});



/*
paths:
  /eliminar-grupo/{groupId}:
    delete:
      summary: Elimina un grupo específico.
      description: Este endpoint elimina un grupo existente dado su ID. Si el grupo es eliminado con éxito, retorna un mensaje de confirmación. Si el grupo no existe, retorna un error indicando que el grupo no fue encontrado.
      operationId: eliminarGrupo
      tags:
        - Grupos
      parameters:
        - in: path
          name: groupId
          required: true
          schema:
            type: string
          description: El ID del grupo que se desea eliminar.
      responses:
        '200':
          description: El grupo ha sido eliminado exitosamente.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Grupo eliminado correctamente."
        '404':
          description: No se encontró el grupo especificado.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Grupo no encontrado."
        '500':
          description: Error interno del servidor debido a un problema al intentar eliminar el grupo.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al eliminar el grupo"
                    */
app.delete('/eliminar-grupo/:groupId', (req, res) => {
  const { groupId } = req.params;

  const sql = 'DELETE FROM Grupos WHERE ID_Grupo = ?';

  db.query(sql, [groupId], (err, result) => {
    if (err) {
      console.error('Error al eliminar el grupo:', err);
      return res.status(500).send('Error al eliminar el grupo');
    }

    if (result.affectedRows > 0) {
      res.send('Grupo eliminado correctamente.');
    } else {
      res.status(404).send('Grupo no encontrado.');
    }
  });
});

/*
paths:
  /eliminar-usuario_grupo/{groupId}/{userId}:
    delete:
      summary: Elimina un usuario de un grupo.
      description: Este endpoint desvincula un usuario de un grupo específico al eliminar su asociación en la base de datos. Se especifican tanto el ID del grupo como el ID del usuario en la URL.
      operationId: eliminarUsuarioDeGrupo
      tags:
        - Grupos
        - Usuarios
      parameters:
        - in: path
          name: groupId
          required: true
          schema:
            type: string
          description: El ID del grupo del cual se va a eliminar el usuario.
        - in: path
          name: userId
          required: true
          schema:
            type: string
          description: El ID del usuario que será eliminado del grupo.
      responses:
        '200':
          description: El usuario ha sido eliminado del grupo exitosamente.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Usuario ya no pertenece al grupo"
        '404':
          description: El grupo o el usuario no fue encontrado o el usuario no pertenecía al grupo.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Grupo no encontrado."
        '500':
          description: Error interno del servidor debido a un problema al intentar eliminar la asociación.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al eliminar el grupo"
*/
app.delete('/eliminar-usuario_grupo/:groupId/:userId', (req, res) => {
  console.log('REQ ' + req.params)
  const { groupId , userId } = req.params;
  console.log('Grupo e ID Usuario: ' + groupId + ' ' + userId)

  const sql = 'DELETE FROM Usuario_Grupo2 WHERE ID_Grupo = ? AND ID_Usuario = ?';

  db.query(sql, [groupId, userId], (err, result) => {
    if (err) {
      console.error('Error al eliminar usuariio y grupo:', err);
      return res.status(500).send('Error al eliminar el grupo');
    }

    if (result.affectedRows > 0) {
      res.send('Usuario ya no pertenece al grupo');
    } else {
      res.status(404).send('Grupo no encontrado.');
    }
  });
});

/*
paths:
  /eliminar-cuenta/{userId}:
    delete:
      summary: Elimina la cuenta de un usuario.
      description: Este endpoint elimina permanentemente la cuenta de un usuario específico utilizando su ID. Si la cuenta es eliminada con éxito, retorna un mensaje de confirmación. Si no se encuentra la cuenta, retorna un error.
      operationId: eliminarCuentaUsuario
      tags:
        - Usuarios
      parameters:
        - in: path
          name: userId
          required: true
          schema:
            type: string
          description: El ID del usuario cuya cuenta se desea eliminar.
      responses:
        '200':
          description: La cuenta ha sido eliminada exitosamente.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Cuenta eliminada correctamente."
        '404':
          description: La cuenta del usuario no fue encontrada.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Cuenta no encontrada."
        '500':
          description: Error interno del servidor debido a un problema al intentar eliminar la cuenta.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al eliminar la cuenta"
*/
app.delete('/eliminar-cuenta/:userId', (req, res) => {
  const { userId } = req.params;

  const sql = 'DELETE FROM Usuarios WHERE Id = ?';

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error al eliminar la cuenta:', err);
      return res.status(500).send('Error al eliminar la cuenta');
    }

    if (result.affectedRows > 0) {
      res.send('Cuenta eliminada correctamente.');
    } else {
      res.status(404).send('Cuenta no encontrada.');
    }
  });
});


/*
paths:
  /enviar-soporte:
    post:
      summary: Envía un mensaje de soporte vía correo electrónico.
      description: Este endpoint recoge información de un formulario de soporte y envía un correo electrónico al equipo de soporte. Acepta nombre, email y mensaje del usuario y utiliza estos datos para enviar el correo.
      operationId: enviarMensajeSoporte
      tags:
        - Soporte
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - nombre
                - email
                - mensaje
              properties:
                nombre:
                  type: string
                  description: El nombre del usuario que solicita soporte.
                  example: "Diego"
                email:
                  type: string
                  description: El correo electrónico del usuario desde donde se envía la solicitud.
                  example: "usuario@example.com"
                mensaje:
                  type: string
                  description: El mensaje detallado del usuario explicando su problema o consulta.
                  example: "Tengo un problema con mi cuenta y no puedo acceder."
      responses:
        '200':
          description: Mensaje enviado con éxito al equipo de soporte.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Mensaje enviado con éxito"
        '500':
          description: Error al enviar el mensaje debido a un problema en el servidor o en la configuración del correo.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Error al enviar el mensaje"

                    */
app.post('/enviar-soporte', (req, res) => {
  const { nombre, email, mensaje } = req.body;
  

  let transporter = nodemailer.createTransport({
      service: 'gmail', // Ejemplo con Gmail; ajusta según tu proveedor
      auth: {
          user: 'diego.vinalslage@gmail.com', // Tu dirección de correo
          pass: 'jdlh mfat iezv vcgp', // Tu contraseña o token de app
      }
  });

  let mailOptions = {
      from: `FAMILY SERIES TRACK`, // Remitente (opcional)
      to: 'diego.vinalslage@gmail.com', // Dirección a la que enviarás el email
      subject: `Nueva solicitud de soporte de ${nombre}`, // Asunto
      text: `Nombre: ${nombre}\nEmail: ${email}\nMensaje: ${mensaje}`, // Cuerpo del mensaje
      // Si quieres enviar HTML: html: '<b>Hola mundo</b>'
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
          res.status(500).send('Error al enviar el mensaje');
      }
      console.log('Mensaje enviado: %s', info.messageId);
      res.send('Mensaje enviado con éxito');
  });
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Escuchar en un puerto
