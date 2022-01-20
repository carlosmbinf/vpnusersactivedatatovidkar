const simpleDDP = require("simpleddp"); // nodejs
const ws = require("isomorphic-ws");
var cron = require("node-cron");

let opts = {
    endpoint: "ws://vidkar.sytes.net:6000/websocket",
    SocketConstructor: ws,
    reconnectInterval: 10000,
};
var server = new simpleDDP(opts);




/////LISTA DE MEGAS CONSUMIDOS POR USUARIOS
var consumos = {}

/////LISTA DE USUARIOS CONECTADOS
var listadeclientesconectados = []


server.on('connected', async () => {
    // do something
    console.log("Conectado");
    


});

server.on('disconnected', () => {
    // for example show alert to user
    console.info("Desconectado");
});

server.on('error', (e) => {
    // global errors from server
    console.error(e);
});


cron
    .schedule(
        "*/2 0-59 0-23 1-31 1-12 *",
        async () => {
            server.connected ? 
               ejecutar()
            
            : server.connect()
        },
        {
            scheduled: true,
            timezone: "America/Havana",
        }
    )
    .start();

ejecutar = async () => {
        try {


            let userSub = server.subscribe("user",{vpnip:2});
            await userSub.ready();
            ////!!!aqui se actualiza LOS MEGAS PARA VIDKAR!!!
            
    
        /////TAREA DE 10 SEGUNDOS
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
                let megasGastados = element[elementppp].tx.bytes 
    
                /////LISTA LOS CONECTADOS PARA COMPARARLOS CON EL REGISTRO DE MEGAS PARA SABER CUAL SE DESCONECTO
                listadeclientesconectados.push(cliente)
    
    
                console.log(`CLIENTE: ${cliente} gasto: ${megasGastados/ 1000000}`);
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
                array1.map(async (a) => {
                    let ip = await a.split(".")[3]
                    console.log(ip);
                    let user = (await server.call('getusers', { vpnip: Number(ip) }))[0]

                    console.log(consumos[a]);
                    await server.call('setOnlineVPN', user._id, { vpnMbGastados: user.vpnMbGastados ? (user.vpnMbGastados + consumos[a]) : consumos[a] })
                    delete consumos[a]
                })
            )
    
            //limpia cache de conectados
            listadeclientesconectados = []
    
    
        });
    
    
    
    
    
    
    
    
            // server.call('setOnlineVPN', user._id, { "vpn2mbConnected": disponible })
    
        } catch (error) {
            console.error(error);
        }
    }