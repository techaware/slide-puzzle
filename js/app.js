/** @jsx React.DOM */

// ReactJS Slide Puzzle
// Author:     Evan Henley
// Author URI: henleyedition.com

(function () {

    var Chart = ReactGoogleCharts.default.Chart;

    var Game = React.createClass({

        shuffle: function (array) {

            // switches first two tiles
            function switchTiles(array) {
                var i = 0;

                // find the first two tiles in a row
                while (!array[i] || !array[i + 1]) i++;

                // store tile value
                var tile = array[i];
                // switche values
                array[i] = array[i + 1];
                array[i + 1] = tile;

                return array;
            }

            // counts inversions
            function countInversions(array) {
                // make array of inversions
                var invArray = array.map(function (num, i) {
                    var inversions = 0;
                    for (j = i + 1; j < array.length; j++) {
                        if (array[j] && array[j] < num) {
                            inversions += 1;
                        }
                    }
                    return inversions;
                });
                // return sum of inversions array
                return invArray.reduce(function (a, b) {
                    return a + b;
                });
            }

            // fischer-yates shuffle algorithm
            function fischerYates(array) {
                var counter = array.length, temp, index;

                // While there are elements in the array
                while (counter > 0) {
                    // Pick a random index
                    index = Math.floor(Math.random() * counter);
                    // Decrease counter by 1
                    counter--;
                    // And swap the last element with it
                    temp = array[counter];
                    array[counter] = array[index];
                    array[index] = temp;
                }

                return array;
            }

            // Fischer-Yates shuffle
            array = fischerYates(array);

            // check for even number of inversions
            if (countInversions(array) % 2 !== 0) {
                // switch two tiles if odd
                array = switchTiles(array);
            }

            return array;
        },
        getInitialState: function () {
            var initState = this.shuffle([
                1, 2, 3,
                4, 5, 6,
                7, 8, ''
            ]);

            return {
                // initial state of game board
                board1:{
                    number: 1,
                    tiles: initState,
                    win: false,
                    prevStates: [[...initState]],
                    distances: [[0, 20]]
                },
                board2:{
                    number: 2,
                    tiles: initState,
                    win: false,
                    prevStates: [[...initState]],
                    distances: [[0, 20]]
                }
            };
        },
        checkBoard: function (br) {
            if(br==1){
                var tiles = this.state.board1.tiles;
            }else{
                var tiles = this.state.board2.tiles;
            }

            for (var i = 0; i < tiles.length - 1; i++) {
                if (tiles[i] !== i + 1) return false;
            }

            return true;
        },

        tileMoveAll:function(){
            // setTimeout(function(){
            //     this.tileMove(1);
            // },0);
            this.tileMove(2);
        },
        tileMove: function (br) {


            //get element from position
            function findVacant() {
                for (var i = 0; i < tiles.length; i++) {
                    if (tiles[i] == '')return i;
                }
            };

            function getDistance(tPos, vPos, tiles) {
                //    find distance when tile is moved from tPos to vPos
                sTiles = [...tiles];
                sTiles[vPos] = tiles[tPos];
                sTiles[tPos] = '';
                //    distance matrix
                var ds = [
                    [0, 1, 2, 1, 2, 3, 2, 3, 4], [1, 0, 1, 2, 1, 2, 3, 2, 3], [2, 1, 0, 3, 2, 1, 4, 3, 2],
                    [1, 2, 3, 0, 1, 2, 1, 2, 3], [2, 1, 2, 1, 0, 1, 2, 1, 2], [3, 2, 1, 2, 1, 0, 3, 2, 1],
                    [2, 3, 4, 1, 2, 3, 0, 1, 2], [3, 2, 3, 2, 1, 2, 1, 0, 1], [4, 3, 2, 3, 2, 1, 2, 1, 0]
                ];

                var tDs = 0;
                var tVal = sTiles[vPos];
                // tDs = ds[tVal-1][vPos];
                for (var i = 0; i < sTiles.length; i++) {
                    var tVal = sTiles[i];
                    if (tVal != '') {
                        tDs = tDs + ds[tVal - 1][i];
                    }
                }

                return tDs;
            };

            function stateExists(tPos, vPos) {
                //    check if tile at tPos is moved to vPos then the new state was already observed
                var sTiles = [...tiles];
                sTiles[vPos] = tiles[tPos];
                sTiles[tPos] = '';

                for (var i = 0; i < prevStates.length; i++) {
                    if (prevStates[i].toString() == sTiles.toString())return true;
                }
            };
            function pickTileToMove(vPos) {
                // Possible moves to fill vacant
                // [up,right,down,left]
                var sTiles = [...tiles];
                // var moves = [
                //     [3,null,null,1],[4,0,null,2],[5,1,null,null],
                //     [6,null,0,4],   [7,3,1,5],   [8,4,2,null],
                //     [null,null,3,7],[null,6,4,8],[null,7,5,null]
                // ];
                var moves = [
                    [3, 1], [4, 0, 2], [5, 1],
                    [6, 0, 4], [1, 3, 5, 7], [8, 4, 2],
                    [3, 7], [6, 4, 8], [7, 5]
                ];
                var tDs = 100, pickTilePos;
                var newState = false;
                for (var i = 0; i < moves[vPos].length; i++) {
                    var tPos = moves[vPos][i];
                    // if an adjacent tile is empty
                    if (!stateExists(tPos, vPos)) {
                        newState = true;
                        var ds = getDistance(tPos, vPos, sTiles);
                        if (ds <= tDs) {
                            pickTilePos = tPos;
                            tDs = ds;
                        }
                    }
                }

                return {newState: newState, tPos: pickTilePos, tDs: tDs};

            };
            function isEqual(a, b) {
                if (a != null && b == null)return false
                if (a == null && b != null)return false
                if (a.toString() != b.toString())return false
                return true
            };

            function pickTileToMoveWithDepth(vPos, depth, sTiles, prevTiles) {
                // Possible moves to fill vacant
                // [up,right,down,left]

                // var moves = [
                //     [3,null,null,1],[4,0,null,2],[5,1,null,null],
                //     [6,null,0,4],   [7,3,1,5],   [8,4,2,null],
                //     [null,null,3,7],[null,6,4,8],[null,7,5,null]
                // ];
                var moves = [
                    [3, 1], [4, 0, 2], [5, 1],
                    [6, 0, 4], [1, 3, 5, 7], [8, 4, 2],
                    [3, 7], [6, 4, 8], [7, 5]
                ];
                var tDs = 100, pickTilePos;
                var newState = false;
                var nxDs = 0;
                for (var i = 0; i < moves[vPos].length; i++) {
                    var dp = depth;
                    var tPos = moves[vPos][i];
                    //simulate the move in sTiles
                    var nxTiles = [...sTiles];
                    nxTiles[vPos] = nxTiles[tPos];
                    nxTiles[tPos] = '';
                    //if nxTiles is same as previous then  drop it
                    if (!isEqual(nxTiles, prevTiles)) {
                        while (dp != 0) {
                            dp--;
                            var rt = pickTileToMoveWithDepth(tPos, dp, nxTiles, sTiles);
                            nxDs = rt.tDs;
                        }
                        // if an adjacent tile is empty
                        if (!stateExists(tPos, vPos)) {
                            newState = true;
                            var ds = getDistance(tPos, vPos, sTiles);
                            //add nxDs
                            ds = ds + nxDs;
                            if (ds <= tDs) {
                                pickTilePos = tPos;
                                tDs = ds;
                            }
                        }
                    }

                }

                return {newState: newState, tPos: pickTilePos, tDs: tDs};

            };

            if(br==1){
                var tiles = this.state.board1.tiles;
                var prevStates = this.state.board1.prevStates;
                var vacantPos = findVacant();
                var sTiles = [...tiles];
                var rt = pickTileToMove(vacantPos);
                if (rt.newState == true) {

                    var dCopy = [...this.state.board1.distances];
                    dCopy[dCopy.length] = [dCopy.length + 1, rt.tDs];

                    this.setState({board1:{distances:dCopy}});

                    var tileEl = document.querySelector('.tile1:nth-child(' + (rt.tPos + 1) + ')');
                    this.tileClick(tileEl, rt.tPos, tiles[rt.tPos],this.state.board1);
                }
            }else{
                var tiles = this.state.board2.tiles;
                var prevStates = this.state.board2.prevStates;
                var vacantPos = findVacant();
                var sTiles = [...tiles];
                    var rt = pickTileToMoveWithDepth(vacantPos, 1, sTiles);
                    if (rt.newState == true) {
                        var dCopy = [...this.state.board2.distances];
                        dCopy[dCopy.length] = [dCopy.length + 1, rt.tDs];

                        this.setState({board2:{distances:dCopy}});

                        var tileEl = document.querySelector('.tile2:nth-child(' + (rt.tPos + 1) + ')');
                        this.tileClick(tileEl, rt.tPos, tiles[rt.tPos],this.state.board1);
                    }

            }

            //   TODO: uses hill climbing algo to decide







            //  simulate the tile click
            //  get DOM for the tile click
        },
        tileClick: function (tileEl, position, status,board) {

                var tiles = board.tiles;
                var prevStates = board.prevStates;

            // Possible moves
            // [up,right,down,left]
            // 9 = out of bounds
            var moves = [
                [null, 1, 3, null], [null, 2, 4, 0], [null, null, 5, 1],
                [0, 4, 6, null], [1, 5, 7, 3], [2, null, 8, 4],
                [3, 7, null, null], [4, 8, null, 6], [5, null, null, 7]
            ];

            function animateTiles(i, move,brno) {
                var directions = ['up', 'right', 'down', 'left'];
                if(brno==1){
                    var moveToEl = document.querySelector('.tile1:nth-child(' + (move + 1) + ')');
                }else{
                    var moveToEl = document.querySelector('.til2:nth-child(' + (move + 1) + ')');
                }

                direction = directions[i];
                tileEl.classList.add('move-' + direction);
                // this is all a little hackish.
                // css/js are used together to create the illusion of moving blocks
                setTimeout(function () {
                    moveToEl.classList.add('highlight');
                    tileEl.classList.remove('move-' + direction);
                    // time horribly linked with css transition
                    setTimeout(function () {
                        moveToEl.classList.remove('highlight');
                    }, 400);
                }, 200);
            }

            // called after tile is fully moved
            // sets new state
            function afterAnimate() {
                brnr = board.number;
                tiles[position] = '';
                tiles[move] = status;
                prevStates[prevStates.length] = [...tiles];
                // var win = this.checkBoard(brnr);
                if(brnr==1){
                    this.setState(
                        {board1:{
                            tiles: tiles,
                            win: this.checkBoard(brnr),
                            prevStates: prevStates
                    }});
                    //next move
                    this.tileMove(1);
                }else{
                    this.setState(
                        {board2:{
                            tiles: tiles,
                            win: this.checkBoard(brnr),
                            prevStates: prevStates
                        }});
                    //next move
                    this.tileMove(2);
                }
            };

            // return if they've already won
            if (board.win) return;

            // check possible moves
            for (var i = 0; i < moves[position].length; i++) {
                var move = moves[position][i];
                // if an adjacent tile is empty
                if (typeof move === 'number' && !tiles[move]) {
                    animateTiles(i, move,board.number);
                    setTimeout(afterAnimate.bind(this), 200);
                    break;
                }
            }
        },
        restartGame: function () {
            this.setState(this.getInitialState());
        },
        render: function () {
            return <div>
                <div id="game-board">
                    {this.state.board1.tiles.map(function (tile, position) {
                        return ( <Tile board={1} status={tile} key={position} tileClick={this.tileClick}/> );
                    }, this)}
                </div>
                <div id="game-board">
                    {this.state.board2.tiles.map(function (tile, position) {
                        return ( <Tile board={2} status={tile} key={position} tileClick={this.tileClick}/> );
                    }, this)}
                </div>
                <Menu winClass={this.state.win ? 'button win' : 'button'}
                      status={this.state.win ? 'You win!' : 'Solve the puzzle.'} restart={this.restartGame}
                      nextMove={this.tileMoveAll}/>

                <DistanceChart board = {'board1'} distances={this.state.board1.distances}/>
                <DistanceChart board = {'board2'} distances={this.state.board2.distances}/>
                {/*<DistanceChart distances={this.state.board2.distances}/>*/}
            </div>;
        }
    });

    var DistanceChart = React.createClass({
        getInitialState: function () {
            return {
                options: {
                    title: 'Distance by Moves',
                    hAxis: {title: 'Moves', minValue: 0, maxValue: 500},
                    vAxis: {title: 'Distance', minValue: 0, maxValue: 25},
                    legend: 'none',
                },
                rows: [],
                columns: [
                    {
                        type: 'number',
                        label: 'Move',
                    },
                    {
                        type: 'number',
                        label: 'Distance',
                    },
                ]
            }
        },
        render: function () {
            return <div className={'my-pretty-chart-container'}>
                <Chart
                    chartType="LineChart"
                    rows={this.props.distances}
                    columns={this.state.columns}
                    options={this.state.options}
                    graph_id={this.props.board}
                    width="50%"
                    height="400px"
                    legend_toggle
                />
            </div>;
        }
    });
    var Tile = React.createClass({
        clickHandler: function (e) {
            this.props.tileClick(e.target, this.props.key, this.props.status);
        },
        render: function () {
            // return <div className="tile" onClick={this.clickHandler}>{this.props.status}</div>;
            return <div className={this.props.board==1?'tile1':'tile2'}>{this.props.status}</div>;
        }
    });

    var Menu = React.createClass({
        clickHandler: function () {
            this.props.restart();
        },
        nextMoveHandler: function () {
            this.props.nextMove();
        },
        render: function () {
            return <div id="menu">
                <h3 id="subtitle">{this.props.status}</h3>
                <a className={this.props.winClass} onClick={this.clickHandler}>Restart</a>
                <a className={this.props.winClass} onClick={this.nextMoveHandler}>Next Move</a>
            </div>;
        }
    });

    // render Game to container
    React.render(
        <Game />,
        document.getElementById('game-container')
    );

}());