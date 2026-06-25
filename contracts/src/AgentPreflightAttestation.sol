// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title AgentPreflightAttestation
/// @notice Stores public pointers to deterministic Celo Agent Preflight reports.
/// @dev The contract attests report existence only. It does not certify safety,
/// quality, or trustworthiness of any agent.
contract AgentPreflightAttestation {
    error InvalidScore(uint16 score);
    error EmptyReportHash();
    error EmptyReportURI();
    error EmptySubject();
    error ReportURITooLong(uint256 length);

    struct ReportPointer {
        uint256 agentId;
        address subject;
        bytes32 reportHash;
        uint16 score;
        string reportURI;
        address attester;
        uint64 timestamp;
    }

    event AgentReportAttested(
        uint256 indexed agentId,
        address indexed subject,
        address indexed attester,
        bytes32 reportHash,
        uint16 score,
        string reportURI,
        uint64 timestamp
    );

    uint16 public constant MAX_SCORE = 100;
    uint16 public constant MAX_REPORT_URI_BYTES = 512;

    mapping(address attester => mapping(uint256 agentId => bytes32 reportHash)) private
        latestReportHashByAttesterAndAgentId;
    mapping(address attester => mapping(address subject => bytes32 reportHash)) private
        latestReportHashByAttesterAndSubject;
    mapping(bytes32 reportHash => mapping(address attester => ReportPointer report)) public reportByHashAndAttester;

    function latestReportByAttesterAndAgentId(address attester, uint256 agentId)
        external
        view
        returns (ReportPointer memory)
    {
        return reportByHashAndAttester[latestReportHashByAttesterAndAgentId[attester][agentId]][attester];
    }

    function latestReportByAttesterAndSubject(address attester, address subject)
        external
        view
        returns (ReportPointer memory)
    {
        return reportByHashAndAttester[latestReportHashByAttesterAndSubject[attester][subject]][attester];
    }

    function attestAgentReport(
        uint256 agentId,
        address subject,
        bytes32 reportHash,
        uint16 score,
        string calldata reportURI
    ) external {
        if (subject == address(0)) {
            revert EmptySubject();
        }

        if (reportHash == bytes32(0)) {
            revert EmptyReportHash();
        }

        if (score > MAX_SCORE) {
            revert InvalidScore(score);
        }

        uint256 reportURILength = bytes(reportURI).length;

        if (reportURILength == 0) {
            revert EmptyReportURI();
        }

        if (reportURILength > MAX_REPORT_URI_BYTES) {
            revert ReportURITooLong(reportURILength);
        }

        uint64 timestamp = uint64(block.timestamp);

        ReportPointer memory report = ReportPointer({
            agentId: agentId,
            subject: subject,
            reportHash: reportHash,
            score: score,
            reportURI: reportURI,
            attester: msg.sender,
            timestamp: timestamp
        });

        reportByHashAndAttester[reportHash][msg.sender] = report;

        if (agentId != 0) {
            latestReportHashByAttesterAndAgentId[msg.sender][agentId] = reportHash;
        }

        latestReportHashByAttesterAndSubject[msg.sender][subject] = reportHash;

        emit AgentReportAttested(agentId, subject, msg.sender, reportHash, score, reportURI, timestamp);
    }
}
