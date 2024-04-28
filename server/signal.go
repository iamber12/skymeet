package server

type Hub struct {
	RoomVsPeersMap map[string][]*Peer
	Register       chan *Peer
	Unregister     chan *Peer
	Broadcast      chan WebsocketMsg
}

func NewHub() *Hub {
	return &Hub{
		RoomVsPeersMap: make(map[string][]*Peer),
		Register:       make(chan *Peer),
		Unregister:     make(chan *Peer),
		Broadcast:      make(chan WebsocketMsg),
	}
}

func (h *Hub) Run(exit <-chan struct{}) <-chan struct{} {
	done := make(chan struct{})

	go func() {
		for {
			select {
			case c := <-h.Register:
				h.RegisterPeer(c)
			case c := <-h.Unregister:
				h.UnregisterPeer(c)
			case msg := <-h.Broadcast:
				if msg.From != "" {
					for _, p := range h.RoomVsPeersMap[msg.RoomUuid] {
						p.Channel <- msg
					}
				} else if msg.To == "" {
					for _, p := range h.RoomVsPeersMap[msg.RoomUuid] {
						if p.Username != msg.PeerId {
							p.Channel <- msg
						}
					}
				} else {
					for _, p := range h.RoomVsPeersMap[msg.RoomUuid] {
						if p.Username == msg.To {
							p.Channel <- msg
							break
						}
					}
				}
			case <-exit:
				for _, r := range h.RoomVsPeersMap {
					for _, p := range r {
						close(p.Channel)
					}
				}
				close(done)
				return
			}
		}
	}()

	return done
}

func (h *Hub) RegisterPeer(peer *Peer) {
	h.RoomVsPeersMap[peer.RoomUuid] = append(h.RoomVsPeersMap[peer.RoomUuid], peer)
}

func (h *Hub) UnregisterPeer(peer *Peer) {
	for i, p := range h.RoomVsPeersMap[peer.RoomUuid] {
		if p == peer {
			close(p.Channel)
			h.RoomVsPeersMap[peer.RoomUuid] = append(h.RoomVsPeersMap[peer.RoomUuid][:i], h.RoomVsPeersMap[peer.RoomUuid][i+1:]...)
		}
	}
}
