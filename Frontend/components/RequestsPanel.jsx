  // Filter requests for branch-scoped managers/staff
  const filteredRequests = me && me.role !== 'SuperAdmin' && me.branch
    ? requests.filter(r => r.payload?.branch === me.branch)
    : requests;

  return (
    <section style={{ marginTop: 28 }}>
      <h2>Requests</h2>
      <div style={{ marginBottom: 8 }}>
        <button onClick={loadRequests} className="btn-outline-blue">Load Requests</button>
      </div>
      {loading ? <div>Loading requests…</div> : (
        <div>
          {filteredRequests.length === 0 ? <div style={{ color: '#888' }}>No requests</div> : (
            <table className="table"><thead><tr><th>Type</th><th>By</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {filteredRequests.map(req => (
                  <tr key={req._id}>
                    <td>{req.type}</td>
                    <td>{req.requesterId?.email}</td>
                    <td>{req.status}</td>
                    <td>
                      {me && (me.role === 'SuperAdmin' || (me.role === 'Manager' && req.payload?.branch === me.branch)) ? (
                        <>
                          {req.status !== 'approved' && <button onClick={()=>updateRequestStatus(req._id, 'approved')} className="btn-outline-blue">Approve</button>}
                          {req.status !== 'rejected' && <button onClick={()=>updateRequestStatus(req._id, 'rejected')} style={{ marginLeft: 8 }} className="btn">Reject</button>}
                        </>
                      ) : (
                        <span style={{ color: '#888' }}>No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
