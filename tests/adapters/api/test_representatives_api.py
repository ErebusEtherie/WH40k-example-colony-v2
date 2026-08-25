"""Representative API endpoint tests."""

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from colony_manager.domain.enums import RepresentativeType


@pytest.fixture
def representatives_with_data(auth_client: TestClient) -> list[dict]:
    """Create test representatives with various types and assignment states."""
    # Create unassigned representatives
    rep1 = {
        "name": "Cardinal Saint Mercurius",
        "type": "cardinal",
        "personalities": [],
        "stats": {"ws": 30, "bs": 30, "s": 30, "t": 30, "ag": 30, "int": 50, "per": 40, "wp": 60, "fel": 50},
        "skills": [],
        "talents": [],
    }
    rep2 = {
        "name": "Judge Dredd",
        "type": "judge",
        "personalities": [],
        "stats": {"ws": 40, "bs": 40, "s": 40, "t": 40, "ag": 40, "int": 40, "per": 50, "wp": 40, "fel": 30},
        "skills": [],
        "talents": [],
    }
    rep3 = {
        "name": "Commander Kane",
        "type": "military_commander",
        "personalities": [],
        "stats": {"ws": 50, "bs": 50, "s": 45, "t": 45, "ag": 45, "int": 35, "per": 45, "wp": 50, "fel": 40},
        "skills": [],
        "talents": [],
    }
    
    # Create representatives
    reps = []
    for rep_data in [rep1, rep2, rep3]:
        response = auth_client.post("/api/v1/representatives", json=rep_data)
        assert response.status_code == status.HTTP_201_CREATED
        reps.append(response.json())
    
    # Assign one representative to a colony
    colony_response = auth_client.post(
        "/api/v1/colonies",
        json={"name": "Test Colony", "owner": "Test Owner", "colony_type": "mining_and_industry"},
    )
    colony_id = colony_response.json()["id"]
    
    assign_response = auth_client.post(
        f"/api/v1/representatives/{reps[0]['id']}/assign", params={"colony_id": colony_id}
    )
    assert assign_response.status_code == status.HTTP_200_OK
    
    return reps


class TestListRepresentatives:
    """Test GET /api/v1/representatives endpoint with filtering."""
    
    def test_list_representatives_returns_all(self, auth_client: TestClient, representatives_with_data: list[dict]) -> None:
        """Test that without filters, all representatives are returned."""
        response = auth_client.get("/api/v1/representatives")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 3
    
    def test_list_representatives_available_only(self, auth_client: TestClient, representatives_with_data: list[dict]) -> None:
        """Test that available_only=true filters out assigned representatives."""
        response = auth_client.get("/api/v1/representatives?available_only=true")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2  # One is assigned
        assert all(rep["assigned_to_colony_id"] is None for rep in data)
    
    def test_list_representatives_filter_by_type(self, auth_client: TestClient, representatives_with_data: list[dict]) -> None:
        """Test that type filter returns only matching representatives."""
        response = auth_client.get("/api/v1/representatives?type=judge")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["type"] == "judge"
        assert data[0]["name"] == "Judge Dredd"
    
    def test_list_representatives_name_search_case_insensitive(self, auth_client: TestClient, representatives_with_data: list[dict]) -> None:
        """Test that name search is case-insensitive substring match."""
        # Search with different cases
        response1 = auth_client.get("/api/v1/representatives?name_search=saint")
        assert response1.status_code == status.HTTP_200_OK
        data1 = response1.json()
        assert len(data1) == 1
        assert "Saint" in data1[0]["name"]
        
        response2 = auth_client.get("/api/v1/representatives?name_search=SAINT")
        assert response2.status_code == status.HTTP_200_OK
        data2 = response2.json()
        assert len(data2) == 1
        
        # Partial match
        response3 = auth_client.get("/api/v1/representatives?name_search=dred")
        assert response3.status_code == status.HTTP_200_OK
        data3 = response3.json()
        assert len(data3) == 1
        assert "Dredd" in data3[0]["name"]
    
    def test_list_representatives_combined_filters(self, auth_client: TestClient, representatives_with_data: list[dict]) -> None:
        """Test that multiple filters work together."""
        # Available CARDINALs (should return 0 since the Cardinal is assigned)
        response = auth_client.get("/api/v1/representatives?available_only=true&type=cardinal")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 0
        
        # Available non-Cardinals
        response2 = auth_client.get("/api/v1/representatives?available_only=true&type=military_commander")
        assert response2.status_code == status.HTTP_200_OK
        data2 = response2.json()
        assert len(data2) == 1
        assert data2[0]["type"] == "military_commander"
    
    def test_list_representatives_empty_result(self, auth_client: TestClient) -> None:
        """Test that non-matching filters return empty list."""
        response = auth_client.get("/api/v1/representatives?type=judge&name_search=NonExistent")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 0
        assert data == []
    
    def test_list_representatives_requires_auth(self, test_client: TestClient) -> None:
        """Test that endpoint requires authentication."""
        response = test_client.get("/api/v1/representatives")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestRepresentativeAssignment:
    """Test representative assignment endpoints."""
    
    def test_assign_representative_to_colony(self, auth_client: TestClient) -> None:
        """Test assigning a representative to a colony."""
        # Create colony
        colony_response = auth_client.post(
            "/api/v1/colonies",
            json={"name": "Test Colony", "owner": "Test Owner", "colony_type": "mining_and_industry"},
        )
        colony_id = colony_response.json()["id"]
        
        # Create representative
        rep_response = auth_client.post(
            "/api/v1/representatives",
            json={
                "name": "Test Rep",
                "type": "judge",
                "personalities": [],
                "stats": {"ws": 30, "bs": 30, "s": 30, "t": 30, "ag": 30, "int": 50, "per": 40, "wp": 60, "fel": 50},
                "skills": [],
                "talents": [],
            },
        )
        rep_id = rep_response.json()["id"]
        
        # Assign to colony
        assign_response = auth_client.post(
            f"/api/v1/representatives/{rep_id}/assign", params={"colony_id": colony_id}
        )
        assert assign_response.status_code == status.HTTP_200_OK
        data = assign_response.json()
        assert data["assigned_to_colony_id"] == colony_id
    
    @pytest.mark.skip(reason="Requires colony_users table migration - tracked separately")
    def test_unassign_representative_from_colony(self, auth_client: TestClient) -> None:
        """Test unassigning a representative from their colony."""
        # Note: This test requires colony_users table which needs DB migration setup
        # This is tracked separately from the filtering feature implementation
        pass