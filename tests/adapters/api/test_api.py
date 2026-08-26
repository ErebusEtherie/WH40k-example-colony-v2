"""API integration tests."""


def test_root_endpoint(test_client):
    """Test root endpoint returns API info."""
    response = test_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "WH40k Colony Manager API" in data["message"]
    assert data["version"] == "0.1.0"


def test_list_colonies_empty(auth_client):
    """Test listing colonies when empty."""
    response = auth_client.get("/api/v1/colonies")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["meta"]["total"] == 0


def test_create_and_get_colony(auth_client):
    """Test creating and retrieving a colony."""
    create_data = {
        "name": "Test Colony",
        "owner": "Test Rogue Trader",
        "colony_type": "mining_and_industry",
    }
    response = auth_client.post("/api/v1/colonies", json=create_data)
    assert response.status_code == 201
    colony = response.json()
    assert colony["name"] == "Test Colony"
    assert "id" in colony


def test_colony_state_nested(auth_client):
    """Test that state is returned in nested format."""
    create_data = {"name": "State Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony = response.json()
    colony_id = colony["id"]

    response = auth_client.get(f"/api/v1/colonies/{colony_id}/state")
    assert response.status_code == 200
    state = response.json()
    assert "size" in state
    assert "base" in state["size"]
    assert "current" in state["size"]
    assert "lore_state" in state["size"]


def test_update_colony(auth_client):
    """Test updating a colony."""
    create_data = {"name": "Update Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]

    update_data = {"name": "Updated Colony"}
    response = auth_client.put(f"/api/v1/colonies/{colony_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Colony"


def test_delete_colony(auth_client):
    """Test deleting a colony."""
    create_data = {"name": "Delete Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]

    response = auth_client.delete(f"/api/v1/colonies/{colony_id}")
    assert response.status_code == 204

    response = auth_client.get(f"/api/v1/colonies/{colony_id}")
    assert response.status_code == 404


def test_advance_colony_age(auth_client):
    """Test advancing colony age."""
    create_data = {"name": "Age Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]

    response = auth_client.post(f"/api/v1/colonies/{colony_id}/age", params={"age_days": 30})
    assert response.status_code == 200
    assert response.json()["age_days"] == 30


def test_colony_modifiers(auth_client):
    """Test adding and listing modifiers."""
    create_data = {"name": "Modifier Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]

    response = auth_client.get(f"/api/v1/colonies/{colony_id}/modifiers")
    assert response.status_code == 200
    assert response.json() == []

    modifier_data = {
        "modifier_source_type": "infrastructure",
        "modifier_category": "permanent",
        "modifier_stat": "complacency",
        "modifier_value": 5,
        "modifier_description": "Test infrastructure",
    }
    response = auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=modifier_data)
    assert response.status_code == 201
    modifier = response.json()
    assert modifier["modifier_value"] == 5

    response = auth_client.get(f"/api/v1/colonies/{colony_id}/modifiers")
    assert response.status_code == 200
    assert len(response.json()) == 1

    modifier_id = modifier["id"]
    response = auth_client.delete(f"/api/v1/colonies/{colony_id}/modifiers/{modifier_id}")
    assert response.status_code == 204

    response = auth_client.get(f"/api/v1/colonies/{colony_id}/modifiers")
    assert response.json() == []


def test_create_representative(auth_client):
    """Test creating and retrieving a representative."""
    create_data = {
        "name": "Test Rep",
        "type": "satrap",
        "personalities": [{"name": "Bold", "description": "Bold personality", "effect": "+1 Fel"}],
        "stats": {
            "ws": 30,
            "bs": 30,
            "s": 30,
            "t": 30,
            "ag": 30,
            "int": 45,
            "per": 35,
            "wp": 40,
            "fel": 50,
        },
        "skills": [],
        "talents": [],
    }
    response = auth_client.post("/api/v1/representatives", json=create_data)
    assert response.status_code == 201
    rep = response.json()
    assert rep["name"] == "Test Rep"
    assert rep["type"] == "satrap"
    assert "leadership_modifier" in rep

    rep_id = rep["id"]
    response = auth_client.get(f"/api/v1/representatives/{rep_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Rep"


def test_assign_representative(auth_client):
    """Test assigning representative to colony."""
    colony_data = {"name": "Colony for Rep", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=colony_data)
    colony_id = response.json()["id"]

    rep_data = {
        "name": "Assigned Rep",
        "type": "satrap",
        "personalities": [{"name": "Bold", "description": "Bold personality", "effect": "+1 Fel"}],
        "stats": {
            "ws": 30,
            "bs": 30,
            "s": 30,
            "t": 30,
            "ag": 30,
            "int": 45,
            "per": 35,
            "wp": 40,
            "fel": 50,
        },
        "skills": [],
        "talents": [],
    }
    response = auth_client.post("/api/v1/representatives", json=rep_data)
    rep_id = response.json()["id"]

    response = auth_client.post(
        f"/api/v1/representatives/{rep_id}/assign", params={"colony_id": colony_id}
    )
    assert response.status_code == 200
    assert response.json()["assigned_to_colony_id"] == colony_id


def test_list_all_modifiers(auth_client):
    """Test listing all modifiers across colonies."""
    for i in range(2):
        colony_data = {
            "name": f"Colony {i}",
            "owner": "Owner",
            "colony_type": "mining_and_industry",
        }
        response = auth_client.post("/api/v1/colonies", json=colony_data)
        colony_id = response.json()["id"]

        modifier_data = {
            "modifier_source_type": "infrastructure",
            "modifier_category": "permanent",
            "modifier_stat": "order",
            "modifier_value": 3,
            "modifier_description": f"Test {i}",
        }
        auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=modifier_data)

    response = auth_client.get("/api/v1/modifiers")
    assert response.status_code == 200
    modifiers = response.json()
    assert len(modifiers) == 2


def test_not_found_error(auth_client):
    """Test 404 error handling."""
    response = auth_client.get("/api/v1/colonies/999")
    assert response.status_code == 404
    assert "detail" in response.json()


def test_docs_available(test_client):
    """Test that API docs are available."""
    response = test_client.get("/docs")
    assert response.status_code == 200
    assert "swagger" in response.text.lower() or "openapi" in response.text.lower()


def test_update_colony_modifier(auth_client):
    """Test updating a colony modifier (PATCH endpoint)."""
    # Create colony
    create_data = {"name": "Modifier Update Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]

    # Add a modifier
    modifier_data = {
        "modifier_source_type": "infrastructure",
        "modifier_category": "permanent",
        "modifier_stat": "order",
        "modifier_value": 3,
        "modifier_description": "Test modifier",
        "is_active": True,  # Explicitly set to verify default behavior
    }
    response = auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=modifier_data)
    assert response.status_code == 201
    modifier = response.json()
    modifier_id = modifier["id"]
    assert modifier["is_active"] == modifier_data["is_active"]

    # Update the modifier (toggle is_active)
    update_data = {"is_active": False}
    response = auth_client.patch(f"/api/v1/colonies/{colony_id}/modifiers/{modifier_id}", json=update_data)
    assert response.status_code == 200
    updated = response.json()
    assert updated["is_active"] is False
    assert updated["modifier_description"] == "Test modifier"
    assert updated["modifier_value"] == 3

    # Update description
    update_data = {"modifier_description": "Updated description"}
    response = auth_client.patch(f"/api/v1/colonies/{colony_id}/modifiers/{modifier_id}", json=update_data)
    assert response.status_code == 200
    updated = response.json()
    assert updated["modifier_description"] == "Updated description"
    assert updated["is_active"] is False  # Should still be False


def test_update_colony_modifier_not_found(auth_client):
    """Test updating a non-existent modifier returns 404."""
    # Create colony
    create_data = {"name": "Modifier 404 Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]

    # Try to update non-existent modifier
    update_data = {"is_active": False}
    response = auth_client.patch(f"/api/v1/colonies/{colony_id}/modifiers/999", json=update_data)
    assert response.status_code == 404
    assert "detail" in response.json()


def test_update_colony_modifier_partial_update(auth_client):
    """Test that PATCH only updates provided fields."""
    # Create colony
    create_data = {"name": "Partial Update Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    colony_id = response.json()["id"]

    # Add a modifier (use valid enum values)
    modifier_data = {
        "modifier_source_type": "gm_custom",
        "modifier_category": "conditional",
        "modifier_stat": "productivity",
        "modifier_value": -2,
        "modifier_description": "Original description",
    }
    response = auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=modifier_data)
    assert response.status_code == 201
    modifier = response.json()
    modifier_id = modifier["id"]

    # Update only is_active, leave description unchanged
    update_data = {"is_active": False}
    response = auth_client.patch(f"/api/v1/colonies/{colony_id}/modifiers/{modifier_id}", json=update_data)
    assert response.status_code == 200
    updated = response.json()
    assert updated["is_active"] is False
    assert updated["modifier_description"] == "Original description"
    assert updated["modifier_stat"] == "productivity"
    assert updated["modifier_value"] == -2


def test_get_colony_modifier_breakdown(auth_client):
    """Test getting modifier breakdown for a colony."""
    # Create colony
    create_data = {"name": "Breakdown Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    assert response.status_code == 201
    colony_id = response.json()["id"]

    # Add some modifiers
    size_modifier = {
        "modifier_source_type": "infrastructure",
        "modifier_category": "permanent",
        "modifier_stat": "size",
        "modifier_value": 1,
        "modifier_description": "Advanced Manufactorum",
    }
    response = auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=size_modifier)
    assert response.status_code == 201

    productivity_modifier = {
        "modifier_source_type": "gm_custom",
        "modifier_category": "conditional",
        "modifier_stat": "productivity",
        "modifier_value": 2,
        "modifier_description": "Trade Windfall",
    }
    response = auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=productivity_modifier)
    assert response.status_code == 201

    # Get breakdown
    response = auth_client.get(f"/api/v1/colonies/{colony_id}/modifier-breakdown")
    assert response.status_code == 200
    breakdown = response.json()

    # Verify structure
    assert "size" in breakdown
    assert "complacency" in breakdown
    assert "order" in breakdown
    assert "productivity" in breakdown
    assert "piety" in breakdown
    assert "leadership_modifier" in breakdown
    assert "profit_factor" in breakdown

    # Verify size breakdown
    assert breakdown["size"]["base"] == 1  # mining_and_industry base size
    assert len(breakdown["size"]["modifiers"]) == 1
    assert breakdown["size"]["modifiers"][0]["source_type"] == "infrastructure"
    assert breakdown["size"]["modifiers"][0]["source_name"] == "Advanced Manufactorum"
    assert breakdown["size"]["modifiers"][0]["value"] == 1
    assert breakdown["size"]["total_modifier"] == 1
    assert breakdown["size"]["current"] == 2  # base 1 + 1

    # Verify productivity breakdown
    assert breakdown["productivity"]["base"] == 2  # mining_and_industry base productivity
    assert len(breakdown["productivity"]["modifiers"]) == 1
    assert breakdown["productivity"]["modifiers"][0]["source_type"] == "gm_custom"
    assert breakdown["productivity"]["modifiers"][0]["value"] == 2
    assert breakdown["productivity"]["total_modifier"] == 2


def test_get_colony_modifier_breakdown_empty(auth_client):
    """Test modifier breakdown with no modifiers."""
    # Create colony
    create_data = {"name": "Empty Breakdown Test", "owner": "Owner", "colony_type": "agricultural"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    assert response.status_code == 201
    colony_id = response.json()["id"]

    # Get breakdown
    response = auth_client.get(f"/api/v1/colonies/{colony_id}/modifier-breakdown")
    assert response.status_code == 200
    breakdown = response.json()

    # Verify all stats have empty modifiers
    for stat in ["size", "complacency", "order", "productivity", "piety"]:
        assert breakdown[stat]["base"] >= 0
        assert len(breakdown[stat]["modifiers"]) == 0
        assert breakdown[stat]["total_modifier"] == 0
    # Note: current may differ from base due to conditional bonuses (Orderly, Pious traits)


def test_get_colony_modifier_breakdown_multiple_modifiers(auth_client):
    """Test breakdown with multiple modifiers per stat."""
    # Create colony
    create_data = {"name": "Multi Modifier Test", "owner": "Owner", "colony_type": "ecclesiastical"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    assert response.status_code == 201
    colony_id = response.json()["id"]

    # Add multiple order modifiers
    for i, value in enumerate([2, -1, 3]):
        modifier = {
            "modifier_source_type": "gm_custom",
            "modifier_category": "permanent",
            "modifier_stat": "order",
            "modifier_value": value,
            "modifier_description": f"Order modifier {i+1}",
        }
        response = auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=modifier)
        assert response.status_code == 201

    # Get breakdown
    response = auth_client.get(f"/api/v1/colonies/{colony_id}/modifier-breakdown")
    assert response.status_code == 200
    breakdown = response.json()

    # Verify order breakdown
    assert breakdown["order"]["base"] == 2  # ecclesiastical base order
    assert len(breakdown["order"]["modifiers"]) == 3
    assert breakdown["order"]["total_modifier"] == 4  # 2 + (-1) + 3
    # Note: current (7) = base (2) + total_modifier (4) + conditional bonus (1 from Orderly trait)
    assert breakdown["order"]["current"] == 7


def test_get_colony_modifier_breakdown_inactive_modifiers(auth_client):
    """Test that inactive modifiers are excluded from breakdown."""
    # Create colony
    create_data = {"name": "Inactive Modifier Test", "owner": "Owner", "colony_type": "mining_and_industry"}
    response = auth_client.post("/api/v1/colonies", json=create_data)
    assert response.status_code == 201
    colony_id = response.json()["id"]

    # Add active modifier
    active_mod = {
        "modifier_source_type": "gm_custom",
        "modifier_category": "permanent",
        "modifier_stat": "piety",
        "modifier_value": 2,
        "modifier_description": "Active blessing",
        "is_active": True,
    }
    response = auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=active_mod)
    assert response.status_code == 201

    # Add inactive modifier
    inactive_mod = {
        "modifier_source_type": "gm_custom",
        "modifier_category": "permanent",
        "modifier_stat": "piety",
        "modifier_value": 5,
        "modifier_description": "Inactive blessing",
        "is_active": False,
    }
    response = auth_client.post(f"/api/v1/colonies/{colony_id}/modifiers", json=inactive_mod)
    assert response.status_code == 201

    # Get breakdown
    response = auth_client.get(f"/api/v1/colonies/{colony_id}/modifier-breakdown")
    assert response.status_code == 200
    breakdown = response.json()

    # Only active modifier should be in breakdown
    assert len(breakdown["piety"]["modifiers"]) == 1
    assert breakdown["piety"]["modifiers"][0]["source_name"] == "Active blessing"
    assert breakdown["piety"]["total_modifier"] == 2


def test_get_colony_modifier_breakdown_404(auth_client):
    """Test getting breakdown for non-existent colony returns 404."""
    response = auth_client.get("/api/v1/colonies/9999/modifier-breakdown")
    assert response.status_code == 404
    assert "detail" in response.json()
