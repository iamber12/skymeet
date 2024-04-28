package server

import (
	"fmt"
	"github.com/gorilla/websocket"
	"log"
)

type Peer struct {
	Username string
	RoomUuid string
	Channel  chan WebsocketMsg
	Hub      *Hub
	Conn     *websocket.Conn
}

type WebsocketMsg struct {
	PeerId   string
	To       string
	From     string
	RoomUuid string
	RoomLink string
	Data     map[string]interface{}
}

func (p *Peer) Read() {
	defer p.Conn.Close()
	for {
		var msg WebsocketMsg
		if err := p.Conn.ReadJSON(&msg); err != nil {
			log.Println(err)
			p.Hub.Unregister <- p
			return
		}

		msg.PeerId = p.Username
		msg.RoomUuid = p.RoomUuid
		p.Hub.Broadcast <- msg
	}
}

func (p *Peer) Write() {
	defer p.Conn.Close()

	for {
		msg, ok := <-p.Channel
		if !ok {
			break
		}
		fmt.Println("writing to all peers")
		if err := p.Conn.WriteJSON(msg); err != nil {
			log.Println(err)
			p.Hub.Unregister <- p
			return
		}
	}
}
