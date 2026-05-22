/**
 * routeEngine.js
 * Manages the campus graph nodes, edges, and Dijkstra shortest path routing.
 */

class CampusNode {
    constructor(id, name, lat, lon) {
        this.id = id;
        this.name = name;
        this.latitude = lat;
        this.longitude = lon;
    }
}

class CampusGraph {
    constructor() {
        this.nodes = new Map();
        this.adjacencyList = new Map();
    }

    addNode(node) {
        this.nodes.set(node.id, node);
        if (!this.adjacencyList.has(node.id)) {
            this.adjacencyList.set(node.id, []);
        }
    }

    addEdge(nodeId1, nodeId2, weight = 1) {
        if (this.adjacencyList.has(nodeId1)) {
            this.adjacencyList.get(nodeId1).push({ node: nodeId2, weight: weight });
        }
        if (this.adjacencyList.has(nodeId2)) {
            this.adjacencyList.get(nodeId2).push({ node: nodeId1, weight: weight });
        }
    }

    // Ported from findNearestNode in Java
    findNearestNode(lat, lon) {
        let nearestNodeId = null;
        let minDistance = Infinity;

        for (const [id, node] of this.nodes.entries()) {
            const distance = this.getDistance(lat, lon, node.latitude, node.longitude);
            if (distance < minDistance) {
                minDistance = distance;
                nearestNodeId = id;
            }
        }
        return nearestNodeId;
    }

    // Haversine formula to compute distance in meters
    getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const deltaPhi = (lat2 - lat1) * Math.PI / 180;
        const deltaLambda = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                  Math.cos(phi1) * Math.cos(phi2) *
                  Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; 
    }

    // Computes compass bearing from point 1 to point 2 in degrees
    getBearing(lat1, lon1, lat2, lon2) {
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const lat1Rad = lat1 * Math.PI / 180;
        const lat2Rad = lat2 * Math.PI / 180;

        const y = Math.sin(dLon) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                  Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
        const brng = Math.atan2(y, x) * 180 / Math.PI;
        return (brng + 360) % 360;
    }

    // Dijkstra Shortest Path Solver
    findShortestPath(startId, endId) {
        if (!this.nodes.has(startId) || !this.nodes.has(endId)) return null;

        const distances = {};
        const previous = {};
        const queue = [];

        for (const id of this.nodes.keys()) {
            distances[id] = Infinity;
            previous[id] = null;
        }

        distances[startId] = 0;
        queue.push({ id: startId, dist: 0 });

        while (queue.length > 0) {
            queue.sort((a, b) => a.dist - b.dist);
            const current = queue.shift();
            const u = current.id;

            if (u === endId) {
                const path = [];
                let curr = u;
                while (curr !== null) {
                    const node = this.nodes.get(curr);
                    path.unshift({
                        id: node.id,
                        name: node.name,
                        latitude: node.latitude,
                        longitude: node.longitude
                    });
                    curr = previous[curr];
                }
                return path;
            }

            if (distances[u] === Infinity) break;

            const neighbors = this.adjacencyList.get(u) || [];
            for (const neighbor of neighbors) {
                const alt = distances[u] + neighbor.weight;
                if (alt < distances[neighbor.node]) {
                    distances[neighbor.node] = alt;
                    previous[neighbor.node] = u;
                    queue.push({ id: neighbor.node, dist: alt });
                }
            }
        }
        return null;
    }
}

// Seed the SGSITS Campus Node Graph Data
const campusGraph = new CampusGraph();

function initCampusGraphData() {
    // --- Navigation nodes ---
    campusGraph.addNode(new CampusNode("A", "A", 22.72630957515876, 75.87375381142772));
    campusGraph.addNode(new CampusNode("B", "B", 22.727385037214844, 75.87385177483439));
    campusGraph.addNode(new CampusNode("C", "C", 22.72635035663457, 75.87328775385875));
    campusGraph.addNode(new CampusNode("D", "D", 22.725987174475037, 75.87323603025195));
    campusGraph.addNode(new CampusNode("E", "E", 22.725954391201224, 75.87351067839084));
    campusGraph.addNode(new CampusNode("Z", "Z", 22.725592, 75.873256));
    campusGraph.addNode(new CampusNode("F", "F", 22.725768535925837, 75.87359371688493));
    campusGraph.addNode(new CampusNode("G", "G", 22.725560674016823, 75.8735861205643));
    campusGraph.addNode(new CampusNode("Y", "Y", 22.725288062069367, 75.87356707963541));
    campusGraph.addNode(new CampusNode("H", "H", 22.725010652134415, 75.8735237632993));
    campusGraph.addNode(new CampusNode("I", "I", 22.725027035212214, 75.87284557993301));
    campusGraph.addNode(new CampusNode("PP", "Plus Point", 22.72563171829433, 75.87288756271236));
    campusGraph.addNode(new CampusNode("J", "J", 22.72614405852511, 75.87294407799297));
    campusGraph.addNode(new CampusNode("K", "K", 22.72637639822372, 75.87298767549487));
    campusGraph.addNode(new CampusNode("X", "X", 22.725046389954045, 75.87236204266061));
    campusGraph.addNode(new CampusNode("V", "V", 22.72511225177984, 75.87059623093833));
    // campusGraph.addNode(new CampusNode("U", "U", 22.725140627041057, 75.8699662486153));
    campusGraph.addNode(new CampusNode("T", "T", 22.72571183214904, 75.8699501981113));
    campusGraph.addNode(new CampusNode("S", "S", 22.725680663966926, 75.87074514963417));
    campusGraph.addNode(new CampusNode("R", "R", 22.725659114740175, 75.87147070825912));
    campusGraph.addNode(new CampusNode("Q", "Q", 22.72564068619093, 75.8719433696796));
    campusGraph.addNode(new CampusNode("L", "L", 22.727678324699703, 75.8731028821045));
    campusGraph.addNode(new CampusNode("M", "M", 22.727632772725403, 75.87221434171548));
    campusGraph.addNode(new CampusNode("N", "N", 22.727123535459096, 75.87216472005676));
    campusGraph.addNode(new CampusNode("O", "O", 22.726205437925273, 75.87234443625087));
    campusGraph.addNode(new CampusNode("P", "P", 22.72612363201615, 75.8715467216776));

    // --- Building nodes ---
    campusGraph.addNode(new CampusNode("GG", "Golden Gate", 22.726284186170997, 75.87414814535562));
    campusGraph.addNode(new CampusNode("ATC", "Department of Information Techonology (ATC)", 22.72581494817771, 75.87327915844558));
    campusGraph.addNode(new CampusNode("LT", "LT Building", 22.72591, 75.87364));
    campusGraph.addNode(new CampusNode("IP", "Department of IP", 22.725512545480214, 75.87273457910088));

    campusGraph.addNode(new CampusNode("HOSTEL_PLAY_GROUND", "Hostel Play Ground", 22.726225464476244, 75.87280022519063));
    campusGraph.addNode(new CampusNode("MV_HOSTEL", "M. Visvesariya Boys Hostel", 22.72677316459135, 75.87212806086463));
    // campusGraph.addNode(new CampusNode("VOLLEYBALL_COUR÷T", "Volleyball Court", 22.726416914464966, 75.8728468928091));
    campusGraph.addNode(new CampusNode("JC_BOSE_HOSTEL", "JC Bose Boys Hostel", 22.72767686863935, 75.87279199553944));

    campusGraph.addNode(new CampusNode("PROFESSOR_QUARTERS", "Professor's Quarters",  22.727434452041937, 75.87336129273038));

    campusGraph.addNode(new CampusNode("DIRECTORS_HOUSE", "House of Director", 22.72725072542688, 75.87397040514685));
    campusGraph.addNode(new CampusNode("GIRLS_HOSTEL", "Sarojini Naidu Girls Hostel", 22.72764135006807, 75.87385960594767));
    campusGraph.addNode(new CampusNode("EC", "Department of EC", 22.725425, 75.873065));
    campusGraph.addNode(new CampusNode("BM", "Department of Biomedical", 22.725425, 75.873065));

    campusGraph.addNode(new CampusNode("DEPT_APPLIED_PHYSICS", "Department of Applied Physics and Optoelectronics", 22.725182401612333, 75.87341698356055));
    campusGraph.addNode(new CampusNode("CS", "Department of Computer Science", 22.725182401612333, 75.87341698356055));
    campusGraph.addNode(new CampusNode("CAFE_91", "Cafe-91", 22.724987152811654, 75.87352595515536));
    campusGraph.addNode(new CampusNode("MECHANICAL", "Department of Mechanical", 22.725200653970262, 75.87273042206783));
    campusGraph.addNode(new CampusNode("GOLDEN_JUBILEE_AUDITORIUM", "Golden Jubilee Auditorium", 22.725092334174665, 75.87223216814168));
    campusGraph.addNode(new CampusNode("SILVERIA_HALL", "Silveria Hall", 22.725466435505002, 75.8719651432613));
    campusGraph.addNode(new CampusNode("TEAM_GS_RACERS", "Team GS Racers", 22.726096724276974, 75.87211157335415));
    campusGraph.addNode(new CampusNode("DH_HALL", "DH Hall", 22.7259187068436, 75.8722304294318));
    campusGraph.addNode(new CampusNode("STATIONARY", "Stationary Shop", 22.725856239049104, 75.87197561958354));
        campusGraph.addNode(new CampusNode("GYM", "Gym", 22.725856239049104, 75.87197561958354));

   
    campusGraph.addNode(new CampusNode("COMPUTER_CENTER", "Computer Center", 22.725604582283655, 75.87165024037971));
    campusGraph.addNode(new CampusNode("CENTRAL_LIBRARY", "Central Library", 22.72566513704539, 75.87143303219506));
    campusGraph.addNode(new CampusNode("DIRECTORS_OFFICE", "Director's Office", 22.7250695780398, 75.87136999999998));
    campusGraph.addNode(new CampusNode("MATHS", "Department of Applied Mathematics", 22.7250695780398, 75.87136999999998));

    campusGraph.addNode(new CampusNode("EL", "Department of Electrical Engineering", 22.725385, 75.871077));
    campusGraph.addNode(new CampusNode("CIVIL", "Department of Civil Engineering", 22.725307891797577, 75.87080210178179));
    campusGraph.addNode(new CampusNode("SAC_GROUND", "SAC Ground", 22.725140627041057, 75.8699662486153));
    campusGraph.addNode(new CampusNode("PHARMACY", "Department of Pharmacy", 22.725887624704317, 75.86978040365841));
    campusGraph.addNode(new CampusNode("CIDI", "CIDI Lab", 22.72584907119545, 75.87074446802146));
    campusGraph.addNode(new CampusNode("DEPT_APPLIED_CHEMISTRY", "Department of Applied Chemistry", 22.725512850453516, 75.87012555329957));
    campusGraph.addNode(new CampusNode("WORKSHOP", "Workshop", 22.72587270076637, 75.87122178102078));

    // --- Main path edges ---
    campusGraph.addEdge("A", "B", 1);
    campusGraph.addEdge("A", "C", 1);
    campusGraph.addEdge("C", "D", 1);
    campusGraph.addEdge("C", "K", 1);
    campusGraph.addEdge("D", "E", 1);
    campusGraph.addEdge("E", "F", 1);
    // campusGraph.addEdge("D", "Z", 1);

    campusGraph.addEdge("PP", "Z", 1);
    campusGraph.addEdge("G", "Z", 1);
    campusGraph.addEdge("G", "Y", 1);
    campusGraph.addEdge("Y", "H", 1);
    campusGraph.addEdge("H", "I", 1);
    campusGraph.addEdge("I", "X", 1);
    campusGraph.addEdge("X", "DIRECTORS_OFFICE", 1);
    campusGraph.addEdge("X", "MATHS", 1);

    campusGraph.addEdge("DIRECTORS_OFFICE", "V", 1);
    // campusGraph.addEdge("V", "U", 1);
    // campusGraph.addEdge("U", "T", 1);
    campusGraph.addEdge("T", "S", 1);
    campusGraph.addEdge("S", "R", 1);
    campusGraph.addEdge("R", "Q", 1);
    campusGraph.addEdge("Q", "PP", 1);
    campusGraph.addEdge("PP", "I", 1);
    campusGraph.addEdge("PP", "G", 1);
    campusGraph.addEdge("PP", "J", 1);
    campusGraph.addEdge("J", "O", 1);
    campusGraph.addEdge("J", "K", 1);
    campusGraph.addEdge("K", "L", 1);
    campusGraph.addEdge("L", "M", 1);
    campusGraph.addEdge("M", "N", 1);
    campusGraph.addEdge("N", "O", 1);
    campusGraph.addEdge("O", "P", 1);
    campusGraph.addEdge("P", "R", 1);

    // --- Building connection edges ---
    campusGraph.addEdge("A", "GG", 1);
    campusGraph.addEdge("A", "DIRECTORS_HOUSE", 1);
    campusGraph.addEdge("B", "GIRLS_HOSTEL", 1);
    campusGraph.addEdge("B", "PROFESSOR_QUARTERS", 1);
    campusGraph.addEdge("D", "ATC", 1);
    campusGraph.addEdge("Z", "ATC", 1);
    campusGraph.addEdge("F", "LT", 1);
    campusGraph.addEdge("H", "CAFE_91", 1);
     campusGraph.addEdge("L", "JC_BOSE_HOSTEL", 1);
     campusGraph.addEdge("M", "JC_BOSE_HOSTEL", 1);
      campusGraph.addEdge("J", "HOSTEL_PLAY_GROUND", 1);
      campusGraph.addEdge("O", "HOSTEL_PLAY_GROUND", 1);
      campusGraph.addEdge("O", "MV_HOSTEL", 1);
      campusGraph.addEdge("N", "MV_HOSTEL", 1);

    campusGraph.addEdge("H", "CS", 1);
    campusGraph.addEdge("H", "DEPT_APPLIED_PHYSICS", 1);
    campusGraph.addEdge("PP", "EC", 1);
    campusGraph.addEdge("PP", "IP", 1);
    campusGraph.addEdge("PP", "BM", 1);
    campusGraph.addEdge("X", "GOLDEN_JUBILEE_AUDITORIUM", 1);
    campusGraph.addEdge("I", "MECHANICAL", 1);
    campusGraph.addEdge("DIRECTORS_OFFICE", "EL", 1);
    campusGraph.addEdge("V", "CIVIL", 1);
    campusGraph.addEdge("V", "SAC_GROUND", 1);
    campusGraph.addEdge("T", "SAC_GROUND", 1);
    campusGraph.addEdge("T", "PHARMACY", 1);
    campusGraph.addEdge("V", "DEPT_APPLIED_CHEMISTRY", 1);
    campusGraph.addEdge("T", "CIDI_LAB", 1);
    campusGraph.addEdge("R", "CENTRAL_LIBRARY", 1);
    campusGraph.addEdge("R", "WORKSHOP", 1);
    campusGraph.addEdge("Q", "SILVERIA_HALL", 1);
    campusGraph.addEdge("Q", "COMPUTER_CENTER", 1);
    campusGraph.addEdge("Q", "DH_HALL", 1);
    campusGraph.addEdge("Q", "STATIONARY", 1);
    campusGraph.addEdge("P", "TEAM_GS_RACERS", 1);
    campusGraph.addEdge("PP", "GYM", 1);
}

// Automatically initialize map data on script load
initCampusGraphData();

// Export to window context for browser modularity
window.campusGraph = campusGraph;
