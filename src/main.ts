import { autospawn } from "./auto.spawner";
import { constructionManager } from "./construction.manager";
import { eventHandler } from "./event.handler";
import { roomManager } from "./room.manager";


export const loop = function() {

    let eventHndlr = new eventHandler();
    let constuctionMngr = new constructionManager();
    let roomMngr = new roomManager();
    //Temporary cleanup of roads
    // for (var index in Game.constructionSites) {
    //     var cs = Game.constructionSites[index];
    //     if (cs != undefined && cs.room != undefined && cs.room.name != 'W25N38' || cs.pos.y < 9) {
    //         cs.remove();
    //     }
    // }

    // for (var index in Game.rooms['W27N38'].find(FIND_STRUCTURES)) {
    //     var cs = Game.rooms['W27N38'].find(FIND_STRUCTURES)[index];
    //     if (cs.structureType == 'road') {
    //         cs.destroy();
    //     }
    // }

    eventHndlr.creepCountChanged();

    for (var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        var owner = room.controller.owner;
        if (owner != undefined && owner != null) {
            if (room != undefined && room.controller.owner.username == "SmileyFace") {
                eventHndlr.rclUpgrade(room);
            }
        }
    }

    constuctionMngr.setPrioritySite();

    for (var structureId in Game.structures) {
        let structure = Game.structures[structureId];

        if (structure instanceof StructureTower) {
            let closestDamagedStructure = structure.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.hits < 100000) && (structure.structureType == 'rampart');
                }
            });

            if (closestDamagedStructure instanceof Structure) {
                structure.repair(closestDamagedStructure);
            }

            let closestHostile = structure.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile instanceof Creep) {
                structure.attack(closestHostile);
            }
        }
    }

    //Memory Management
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    for (var index in Memory.sites) {
        var site = Memory.sites[index];
        //console.log(site.roomName);
        var siteRoom = Game.rooms[site.roomName];
        if (siteRoom == undefined) {
            Memory.sites.splice(index, 1);
            //console.log('Clearing constructionSite memory in non-found room.');
        } else if (siteRoom.lookForAt(LOOK_CONSTRUCTION_SITES, site.pos.x, site.pos.y).length == 0) {
            Memory.sites.splice(index, 1);
            //console.log('Clearing non-existing constructionSite memory.');
        }
    }

    constuctionMngr.cleanUselessRoads();

    for (var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        var controller = room.controller;

        roomMngr.manageRoom(room);

        if (controller.owner.username == 'SmileyFace') {
            room.find(FIND_MY_SPAWNS).map((spawn: Spawn) => {
                autospawn(spawn);
            });
        }
    }
}
