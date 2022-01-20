var cron = require('node-cron');


/////LISTA DE MEGAS CONSUMIDOS POR USUARIOS
var consumos = {}

/////LISTA DE USUARIOS CONECTADOS
var listadeclientesconectados = []

/////TAREA DE 2 SEGUNDOS
cron.schedule('*/2 * * * * *', () => {
    console.log('EJECUTANDO');

    /////DEVOLVER RESULTADO DE IFCONFIG
    require('ifconfig-linux')().then((element) => {

        /////LISTA LAS INTERFACES
        let listInterfaces = Object.keys(element)

        /////SELECCIONA LAS INTERFACES CON PPP
        let ppp = listInterfaces.filter(interface => interface.includes("ppp"))
        //////RECORRE TODAS LAS INTERFACES
        ppp.map(elementppp => {
            ///////SELECCIONA LA IP DEL CLIENTE
            let cliente = element[elementppp].inet.destination

            //////MEGAS GASTADOS
            let megasGastados = element[elementppp].tx.bytes / 1000000

            /////LISTA LOS CONECTADOS PARA COMPARARLOS CON EL REGISTRO DE MEGAS PARA SABER CUAL SE DESCONECTO
            listadeclientesconectados.push(cliente)


            console.log(`CLIENTE: ${cliente} gasto: ${megasGastados}`);
            consumos[cliente] = megasGastados
        })

        ////////DEVUELVE LA IP DE LOS DESCONECTADOS
        let array1 = Object.keys(consumos).filter(function (val) {
            return listadeclientesconectados.indexOf(val.toString()) == -1;
        });

        console.log(consumos);

        console.log("DESCONECTADOS: " + array1);
        ////// QUITA LOS USUARIOS DESCONECTADOS Y ACTUALIZA LOS MEGAS EN VIDKAR
        array1.length > 0 && (
            array1.map(a => {

                ////!!!aqui se actualiza LOS MEGAS PARA VIDKAR!!!

                delete consumos[a]
            })
        )

        //limpia cache de conectados
        listadeclientesconectados = []


    });
});


