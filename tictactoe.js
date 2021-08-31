module.exports = (app, cors, database) => {
    function checkWin(board) {
        var columna = [board[0], board[3], board[6]];
        if (columna.every( v => (v == columna[0]) && (v != "X") && (v != "."))) return true;
        var columnb = [board[1], board[4], board[7]];
        if (columnb.every( v => (v == columnb[0]) && (v != "X") && (v != "."))) return true;
        var columnc = [board[2], board[5], board[8]];
        if (columnc.every( v => (v == columnc[0]) && (v != "X") && (v != "."))) return true;
        var rowa = [board[0], board[1], board[2]];
        if (rowa.every( v => (v == rowa[0]) && (v != "X") && (v != "."))) return true;
        var rowb = [board[3], board[4], board[5]];
        if (rowb.every( v => (v == rowb[0]) && (v != "X") && (v != "."))) return true;
        var rowc = [board[6], board[7], board[8]];
        if (rowc.every( v => (v == rowc[0]) && (v != "X") && (v != "."))) return true;
        var diagnola = [board[0], board[4], board[8]];
        if (diagnola.every( v => (v == diagnola[0]) && (v != "X") && (v != "."))) return true;
        var diagnolb = [board[2], board[4], board[6]];
        if (diagnolb.every( v => (v == diagnolb[0]) && (v != "X") && (v != "."))) return true;

        return false;
    }
    function checkLoss(board) {
        var columna = [board[0], board[3], board[6]];
        if (columna.every( v => (v == columna[0]) && (v != "O") && (v != "."))) return true;
        var columnb = [board[1], board[4], board[7]];
        if (columnb.every( v => (v == columnb[0]) && (v != "O") && (v != "."))) return true;
        var columnc = [board[2], board[5], board[8]];
        if (columnc.every( v => (v == columnc[0]) && (v != "O") && (v != "."))) return true;
        var rowa = [board[0], board[1], board[2]];
        if (rowa.every( v => (v == rowa[0]) && (v != "O") && (v != "."))) return true;
        var rowb = [board[3], board[4], board[5]];
        if (rowb.every( v => (v == rowb[0]) && (v != "O") && (v != "."))) return true;
        var rowc = [board[6], board[7], board[8]];
        if (rowc.every( v => (v == rowc[0]) && (v != "O") && (v != "."))) return true;
        var diagnola = [board[0], board[4], board[8]];
        if (diagnola.every( v => (v == diagnola[0]) && (v != "O") && (v != "."))) return true;
        var diagnolb = [board[2], board[4], board[6]];
        if (diagnolb.every( v => (v == diagnolb[0]) && (v != "O") && (v != "."))) return true;

        return false;
    }

    app.get("/ttt/move/:board", (req, res) => {
        if (req.params.board.length != 9) return res.json({ "success": false, "message": "Invalid board." });
        if (!req.params.board.match(/[OX.]{9}/g)) return res.json({ "success": false, "message": "Invalid board." });

        var board = req.params.board.split("");

        if (checkWin(board)) {
            res.send(`
                YOU WIN!
                
                <p><u>${board[0]} | ${board[1]} | ${board[2]}</u></p>
                <p><u>${board[3]} | ${board[4]} | ${board[5]}</u></p>
                <p><u>${board[6]} | ${board[7]} | ${board[8]}</u></p>
            `);

            return;
        }

        database.query(`SELECT * FROM \`tictactoe\` WHERE board="${req.params.board}"`, function (error, result, fields) {
            if (error) return error;

            if (result[0]) {
                var moves = JSON.parse(result[0].moves);
                res.send(moves)
            } else {
                var empty = "";
                
                board.forEach((v, i) => {
                    if (v == ".") {
                        empty = empty + i;
                    }
                });

                var move = Math.ceil(Math.random() * (empty.length));

                board[empty[move - 1]] = "X";

                if (checkLoss(board)) {
                    res.send(`
                        YOU LOSE!

                        <p><u>${board[0]} | ${board[1]} | ${board[2]}</u></p>
                        <p><u>${board[3]} | ${board[4]} | ${board[5]}</u></p>
                        <p><u>${board[6]} | ${board[7]} | ${board[8]}</u></p>
                    `);

                    return;
                }

                res.send(`
                    BOARD:
                    
                    <p><u>${board[0]} | ${board[1]} | ${board[2]}</u></p>
                    <p><u>${board[3]} | ${board[4]} | ${board[5]}</u></p>
                    <p><u>${board[6]} | ${board[7]} | ${board[8]}</u></p>
                `);
            }
        });
    });
}