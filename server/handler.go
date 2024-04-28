package server

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"net/http"
)

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func Welcome(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", nil)
}

func Room(c *gin.Context) {
	username := c.Request.FormValue("username")
	roomId := c.Request.FormValue("id")

	if roomId == "" {
		roomId = uuid.NewString()
	}

	c.Redirect(http.StatusTemporaryRedirect, "/room?id="+roomId+"&username="+username)
	return
}

func RoomHandler(c *gin.Context) {
	username := c.Request.FormValue("username")
	roomId := c.Query("id")

	if username == "" {
		data := map[string]interface{}{
			"RoomUuid": roomId,
		}
		c.HTML(http.StatusOK, "index.html", data)
		return
	}

	c.HTML(http.StatusOK, "room.html", WebsocketMsg{PeerId: username, RoomLink: c.Request.Host + "/room?id=" + roomId})
}

func (h *Hub) WebsocketHandler(c *gin.Context) {
	username := c.Request.FormValue("username")
	roomId := c.Request.FormValue("id")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)

	if err != nil {
		return
	}

	newPeer := &Peer{
		Username: username,
		RoomUuid: roomId,
		Channel:  make(chan WebsocketMsg),
		Conn:     conn,
		Hub:      h,
	}

	h.Register <- newPeer

	go newPeer.Read()
	go newPeer.Write()
}
